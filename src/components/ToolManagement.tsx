import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Power, Trash2, Eye, PowerOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  is_active: boolean;
  created_at: string;
}

export const ToolManagement = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTool, setPreviewTool] = useState<Tool | null>(null);
  const [deleteToolId, setDeleteToolId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTools(data || []);
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

  const handleToggleActive = async (toolId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_tools')
        .update({ is_active: !currentStatus })
        .eq('id', toolId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tool ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });

      fetchTools();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteToolId) return;

    try {
      const { error } = await supabase
        .from('ai_tools')
        .delete()
        .eq('id', deleteToolId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tool deleted successfully"
      });

      fetchTools();
      setDeleteToolId(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderToolsList = (filterStatus: string | null = null, filterActive: boolean | null = null, underDevelopment: boolean = false) => {
    let filteredTools = tools;
    
    if (underDevelopment) {
      filteredTools = filteredTools.filter(tool => !tool.webhook_url || tool.webhook_url.trim() === '');
    } else {
      // For other tabs, exclude under-development tools
      filteredTools = filteredTools.filter(tool => tool.webhook_url && tool.webhook_url.trim() !== '');
    }
    
    if (filterStatus) {
      filteredTools = filteredTools.filter(tool => tool.approval_status === filterStatus);
    }
    
    if (filterActive !== null) {
      filteredTools = filteredTools.filter(tool => tool.is_active === filterActive);
    }

    if (filteredTools.length === 0) {
      return <p className="text-muted-foreground text-center py-4">No tools found</p>;
    }

    return (
      <div className="space-y-4">
        {filteredTools.map((tool) => (
          <div key={tool.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{tool.name}</h3>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(tool.approval_status, tool.is_active)}
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
                variant={tool.is_active ? "secondary" : "default"}
                size="sm"
                onClick={() => handleToggleActive(tool.id, tool.is_active)}
              >
                {tool.is_active ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteToolId(tool.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
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
          <CardTitle>Tool Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Tools</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="development">Under Development</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {renderToolsList()}
            </TabsContent>
            
            <TabsContent value="active" className="mt-4">
              {renderToolsList(null, true)}
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-4">
              {renderToolsList(null, false)}
            </TabsContent>
            
            <TabsContent value="approved" className="mt-4">
              {renderToolsList('approved')}
            </TabsContent>
            
            <TabsContent value="development" className="mt-4">
              {renderToolsList(null, null, true)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTool} onOpenChange={() => setPreviewTool(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tool Details</DialogTitle>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(previewTool.approval_status, previewTool.is_active)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">State</label>
                  <p>{previewTool.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              {previewTool.webhook_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Webhook URL</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">{previewTool.webhook_url}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteToolId} onOpenChange={() => setDeleteToolId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tool
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};