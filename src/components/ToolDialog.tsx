import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, CheckCircle, XCircle, Zap } from "lucide-react";
import { z } from "zod";
import { FileViewer } from "./FileViewer";

interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  credit_cost: number;
  input_fields: any;
  icon_url: string;
  webhook_url?: string;
  output_type?: string;
}

interface ToolDialogProps {
  tool: AITool;
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  onCreditsUpdate: () => void;
}

export const ToolDialog = ({ tool, isOpen, onClose, credits, onCreditsUpdate }: ToolDialogProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const canAfford = credits >= tool.credit_cost;

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateForm = () => {
    const fields = Array.isArray(tool.input_fields) 
      ? tool.input_fields 
      : Object.entries(tool.input_fields).map(([name, config]) => ({ name, ...(config as any) }));
    
    for (const field of fields) {
      const fieldName = field.name;
      if (field.required && !formData[fieldName]) {
        throw new Error(`${field.label || fieldName} is required`);
      }
      
      if (field.type === 'file' && formData[fieldName] && field.accept) {
        const file = formData[fieldName];
        const acceptedTypes = field.accept.split(',').map((t: string) => t.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (!acceptedTypes.includes(fileExtension)) {
          throw new Error(`Invalid file type. Please upload a ${acceptedTypes.join(' or ')} file`);
        }
      }

      const value = formData[fieldName];
      if (value !== undefined && value !== null && value !== '' && !(value instanceof File)) {
        try {
          if (typeof value === 'string') {
            if (field.type === 'email' || fieldName.toLowerCase().includes('email')) {
              z.string().email().max(255).parse(value);
            } else if (field.type === 'url' || fieldName.toLowerCase().includes('url')) {
              z.string().url().max(2000).parse(value);
            } else if (field.type === 'textarea') {
              z.string().max(10000, 'Text is too long (max 10000 characters)').parse(value);
            } else {
              z.string().max(1000, 'Input is too long (max 1000 characters)').parse(value);
            }
          } else if (typeof value === 'number') {
            z.number().int().min(-1000000).max(1000000).parse(value);
          }
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            throw new Error(`${field.label || fieldName}: ${validationError.errors[0].message}`);
          }
        }
      }

      if (field.type === 'file' && formData[fieldName]) {
        const file = formData[fieldName];
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        if (sanitizedName !== file.name) {
          const sanitizedFile = new File([file], sanitizedName, { type: file.type });
          setFormData(prev => ({ ...prev, [fieldName]: sanitizedFile }));
        }
      }
    }
  };

  const handleRun = async () => {
    if (!user || !session || !canAfford) return;

    try {
      validateForm();
      setIsRunning(true);
      setError(null);
      setResult(null);

      const { data: currentCredits, error: creditsError } = await (supabase
        .rpc as any)("get_user_credits", { _user_id: user.id });

      if (creditsError || (currentCredits as number) < tool.credit_cost) {
        throw new Error("Insufficient credits");
      }

      const { data: logData, error: logError } = await (supabase
        .from as any)("tool_usages")
        .insert({
          user_id: user.id,
          tool_id: tool.id,
          input_data: formData,
          credits_deducted: tool.credit_cost
        })
        .select()
        .single();

      if (logError) throw logError;

      const toolResult = await processToolWithWebhook(tool, formData);
      
      if (currentCredits !== 999999) {
        const { error: updateError } = await (supabase
          .from as any)("credits")
          .update({
            current_credits: (currentCredits as number) - tool.credit_cost
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }
      
      await (supabase
        .from as any)("tool_usages")
        .update({
          webhook_response: toolResult,
          used_at: new Date().toISOString()
        })
        .eq("id", (logData as any).id);

      setResult(toolResult);
      onCreditsUpdate();
      
      toast({
        title: "Tool completed successfully!",
        description: `Used ${tool.credit_cost} credit${tool.credit_cost !== 1 ? "s" : ""}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      
      toast({
        title: "Tool execution failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const processToolWithWebhook = async (tool: AITool, inputData: any): Promise<any> => {
    if (!tool.webhook_url) {
      throw new Error('This tool requires a webhook URL to be configured.');
    }

    const hasFiles = Object.values(inputData).some(value => value instanceof File);
    
    let requestBody: any;
    let headers: any = {};
    
    if (hasFiles) {
      const formData = new FormData();
      Object.entries(inputData).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
      formData.append('tool_name', tool.name);
      formData.append('user_id', user?.id || '');
      formData.append('timestamp', new Date().toISOString());
      requestBody = formData;
    } else {
      requestBody = JSON.stringify({
        tool_name: tool.name,
        user_id: user?.id,
        input_data: inputData,
        timestamp: new Date().toISOString(),
      });
      headers['Content-Type'] = 'application/json';
    }

    if (import.meta.env.DEV) {
      console.log('Starting webhook call');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(tool.webhook_url, {
        method: 'POST',
        headers: headers,
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Webhook request timed out after 30 seconds.');
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to webhook. Check CORS settings.');
      }
      const originalMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Webhook execution failed: ${originalMessage}`);
    }
  };

  const renderFormField = (fieldConfig: any) => {
    const { name: fieldName, type, label, options, required, placeholder, accept } = fieldConfig;

    switch (type) {
      case "file":
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleInputChange(fieldName, file);
              }}
              className="cursor-pointer"
            />
            {formData[fieldName] && (
              <p className="text-sm text-muted-foreground">
                Selected: {formData[fieldName].name}
              </p>
            )}
          </div>
        );
      
      case "select":
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <Select onValueChange={(value) => handleInputChange(fieldName, value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "textarea":
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              value={formData[fieldName] || ""}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              rows={4}
            />
          </div>
        );

      default:
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="text"
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              value={formData[fieldName] || ""}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{tool.icon_url}</div>
            <div>
              <DialogTitle className="text-xl">{tool.name}</DialogTitle>
              <DialogDescription>{tool.description}</DialogDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline">{tool.category}</Badge>
            <Badge variant={canAfford ? "default" : "destructive"}>
              <Zap className="mr-1 h-3 w-3" />
              {tool.credit_cost} credit{tool.credit_cost !== 1 ? "s" : ""}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Configure Tool</h3>
            {(Array.isArray(tool.input_fields) 
              ? tool.input_fields 
              : Object.entries(tool.input_fields).map(([name, config]) => ({ name, ...(config as any) }))
            ).map((fieldConfig: any) => renderFormField(fieldConfig))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRun}
              disabled={!canAfford || isRunning}
              variant="hero"
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : canAfford ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Tool
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Need More Credits
                </>
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>

          {result && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <h4 className="font-semibold text-success">Results</h4>
              </div>
              <FileViewer data={result} outputType={tool.output_type} />
            </div>
          )}

          {error && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <h4 className="font-semibold text-destructive">Error</h4>
                </div>
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
