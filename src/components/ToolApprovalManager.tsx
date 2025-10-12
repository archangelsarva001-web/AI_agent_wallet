import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  credit_cost: number;
  icon_url?: string;
  webhook_url?: string;
  input_fields: any;
  approval_status: string;
  created_at: string;
}

export const ToolApprovalManager = () => {
  const [pendingTools, setpendingTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTool, setPreviewTool] = useState<Tool | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingTools();
  }, []);

  const fetchPendingTools = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setpendingTools(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (toolId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('ai_tools')
        .update({
          approval_status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', toolId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tool ${status} successfully`
      });

      fetchPendingTools();
      setPreviewTool(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Tool Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTools.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No pending tools to review</p>
          ) : (
            <div className="space-y-4">
              {pendingTools.map((tool) => (
                <div key={tool.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{tool.category}</Badge>
                        <Badge variant="secondary">{tool.credit_cost} credits</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTool(tool)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproval(tool.id, 'approved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleApproval(tool.id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewTool} onOpenChange={() => setPreviewTool(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tool Preview</DialogTitle>
          </DialogHeader>
          {previewTool && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-lg">{previewTool.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p>{previewTool.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p>{previewTool.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credit Cost</label>
                  <p>{previewTool.credit_cost}</p>
                </div>
              </div>

              {previewTool.webhook_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Webhook URL</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{previewTool.webhook_url}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Input Fields</label>
                <div className="space-y-2 mt-2">
                  {previewTool.input_fields && Array.isArray(previewTool.input_fields) && previewTool.input_fields.length > 0 ? (
                    previewTool.input_fields.map((field: any, index: number) => (
                      <div key={index} className="border rounded p-3 bg-muted/50">
                        <p className="font-medium">{field.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {field.type} | Name: {field.name} | Required: {field.required ? 'Yes' : 'No'}
                        </p>
                        {field.placeholder && (
                          <p className="text-sm text-muted-foreground">Placeholder: {field.placeholder}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No input fields defined</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => handleApproval(previewTool.id, 'approved')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => handleApproval(previewTool.id, 'rejected')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};