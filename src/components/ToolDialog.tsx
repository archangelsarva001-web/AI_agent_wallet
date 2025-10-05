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

interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  credit_cost: number;
  input_fields: any;
  icon_url: string;
  webhook_url?: string;
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
      
      // Validate file type if it's a file field
      if (field.type === 'file' && formData[fieldName] && field.accept) {
        const file = formData[fieldName];
        const acceptedTypes = field.accept.split(',').map((t: string) => t.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (!acceptedTypes.includes(fileExtension)) {
          throw new Error(`Invalid file type. Please upload a ${acceptedTypes.join(' or ')} file`);
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

      // Check credits using the role-aware function
      const { data: currentCredits, error: creditsError } = await supabase
        .rpc("get_user_credits", { _user_id: user.id });

      if (creditsError || currentCredits < tool.credit_cost) {
        throw new Error("Insufficient credits");
      }

      // Create usage log
      const { data: logData, error: logError } = await supabase
        .from("tool_usages")
        .insert({
          user_id: user.id,
          tool_id: tool.id,
          input_data: formData,
          credits_deducted: tool.credit_cost
        })
        .select()
        .single();

      if (logError) throw logError;

      // Deduct credits (only if not admin with infinite credits)
      if (currentCredits !== 999999) {
        const { error: updateError } = await supabase
          .from("credits")
          .update({
            current_credits: currentCredits - tool.credit_cost
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      // Process the tool (webhook call if available, otherwise mock)
      const toolResult = await processToolWithWebhook(tool, formData);
      
      // Update usage log with result
      await supabase
        .from("tool_usages")
        .update({
          webhook_response: toolResult,
          used_at: new Date().toISOString()
        })
        .eq("id", logData.id);

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

  // Process tool with webhook support
  const processToolWithWebhook = async (tool: AITool, inputData: any): Promise<any> => {
    if (!tool.webhook_url) {
      throw new Error('This tool requires a webhook URL to be configured. Please contact the administrator to set up the webhook integration.');
    }

    const startTime = Date.now();
    
    // Check if we have file data to send as FormData
    const hasFiles = Object.values(inputData).some(value => value instanceof File);
    
    let requestBody: any;
    let headers: any = {};
    
    if (hasFiles) {
      // Create FormData for file uploads
      const formData = new FormData();
      
      Object.entries(inputData).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
      
      // Add metadata
      formData.append('tool_name', tool.name);
      formData.append('user_id', user?.id || '');
      formData.append('timestamp', new Date().toISOString());
      
      requestBody = formData;
      // Don't set Content-Type header - browser will set it with boundary
    } else {
      // Regular JSON payload
      requestBody = JSON.stringify({
        tool_name: tool.name,
        user_id: user?.id,
        input_data: inputData,
        timestamp: new Date().toISOString(),
      });
      headers['Content-Type'] = 'application/json';
    }

    console.log('🚀 [WEBHOOK DEBUG] Starting webhook call:', {
      url: tool.webhook_url,
      hasFiles: hasFiles,
      timestamp: new Date().toISOString()
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(tool.webhook_url, {
        method: 'POST',
        headers: headers,
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log('📡 [WEBHOOK DEBUG] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseTime: `${responseTime}ms`,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [WEBHOOK DEBUG] Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const result = await response.json();
      console.log('✅ [WEBHOOK DEBUG] Success response:', {
        result: result,
        responseTime: `${responseTime}ms`
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('💥 [WEBHOOK DEBUG] Webhook error details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        responseTime: `${responseTime}ms`,
        url: tool.webhook_url
      });

      // Create user-friendly error messages
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Webhook request timed out after 30 seconds. Please check if your n8n workflow is running and responding correctly.');
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to webhook. This might be a CORS issue or the webhook URL is unreachable. Please check your n8n workflow URL and CORS settings.');
      }

      // Re-throw the original error with additional context
      const originalMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Webhook execution failed: ${originalMessage}. Please check your n8n workflow and webhook configuration.`);
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
                if (file) {
                  handleInputChange(fieldName, file);
                }
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
          {/* Input Form */}
          <div className="space-y-4">
            <h3 className="font-semibold">Configure Tool</h3>
            {(Array.isArray(tool.input_fields) 
              ? tool.input_fields 
              : Object.entries(tool.input_fields).map(([name, config]) => ({ name, ...(config as any) }))
            ).map((fieldConfig: any) => renderFormField(fieldConfig))}
          </div>

          {/* Action Buttons */}
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

          {/* Results */}
          {result && (
            <Card className="border-success/20 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h4 className="font-semibold text-success">Results</h4>
                </div>
                <div className="bg-background p-4 rounded border">
                  {typeof result === 'string' ? (
                    <div className="whitespace-pre-wrap text-sm">{result}</div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
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