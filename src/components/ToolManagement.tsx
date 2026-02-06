import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Power, Trash2, Eye, PowerOff, Edit, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isValidWebhookUrl } from "@/lib/webhook-validation";

interface Tool {
  id: string; name: string; description: string; category: string;
  credit_cost: number; icon_url?: string; webhook_url?: string;
  input_fields: any; approval_status: string; is_active: boolean; created_at: string;
}

interface InputField {
  id?: string; name: string; type: string; label: string; placeholder: string; required: boolean;
}

const fieldTypes = [
  { value: "text", label: "Text" }, { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" }, { value: "email", label: "Email" },
  { value: "url", label: "URL" }, { value: "date", label: "Date" },
  { value: "file", label: "File Upload" },
];

const categories = ["Text Processing", "Image Generation", "Language Processing", "Development", "Marketing", "Communication", "Sales"];

export const ToolManagement = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTool, setPreviewTool] = useState<Tool | null>(null);
  const [deleteToolId, setDeleteToolId] = useState<string | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editWebhookUrl, setEditWebhookUrl] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");
  const [editCreditCost, setEditCreditCost] = useState("1");
  const [editInputFields, setEditInputFields] = useState<InputField[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (editTool) {
      setEditName(editTool.name); setEditDescription(editTool.description);
      setEditCategory(editTool.category); setEditWebhookUrl(editTool.webhook_url || "");
      setEditIconUrl(editTool.icon_url || ""); setEditCreditCost(editTool.credit_cost.toString());
      const fieldsWithIds = (editTool.input_fields || []).map((field: any) => ({ ...field, id: field.id || crypto.randomUUID() }));
      setEditInputFields(fieldsWithIds.length > 0 ? fieldsWithIds : [{ id: crypto.randomUUID(), name: "", type: "text", label: "", placeholder: "", required: true }]);
    }
  }, [editTool]);

  useEffect(() => { fetchTools(); }, []);

  const fetchTools = async () => {
    try {
      const { data, error } = await (supabase.from as any)('ai_tools').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTools(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally { setLoading(false); }
  };

  const handleToggleActive = async (toolId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase.from as any)('ai_tools').update({ is_active: !currentStatus }).eq('id', toolId);
      if (error) throw error;
      toast({ title: "Success", description: `Tool ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
      fetchTools();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteToolId) return;
    try {
      const { error } = await (supabase.from as any)('ai_tools').delete().eq('id', deleteToolId);
      if (error) throw error;
      toast({ title: "Success", description: "Tool deleted successfully" });
      fetchTools(); setDeleteToolId(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const addEditInputField = () => {
    setEditInputFields([...editInputFields, { id: crypto.randomUUID(), name: "", type: "text", label: "", placeholder: "", required: true }]);
  };

  const removeEditInputField = (id: string) => {
    if (editInputFields.length > 1) setEditInputFields(editInputFields.filter((field) => field.id !== id));
  };

  const updateEditInputField = (id: string, key: keyof InputField, value: any) => {
    setEditInputFields(editInputFields.map((field) => field.id === id ? { ...field, [key]: value } : field));
  };

  const handleEditTool = async () => {
    if (!editTool || !editName || !editDescription || !editCategory) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all required fields" });
      return;
    }
    if (editWebhookUrl) {
      const webhookValidation = isValidWebhookUrl(editWebhookUrl);
      if (!webhookValidation.valid) {
        toast({ variant: "destructive", title: "Invalid Webhook URL", description: webhookValidation.error });
        return;
      }
    }
    for (const field of editInputFields) {
      if (!field.name || !field.label) {
        toast({ variant: "destructive", title: "Validation Error", description: "All input fields must have a name and label" });
        return;
      }
    }
    setEditLoading(true);
    try {
      const inputFieldsData = editInputFields.map(({ id, ...field }) => field);
      const { error } = await (supabase.from as any)('ai_tools')
        .update({ name: editName, description: editDescription, category: editCategory, webhook_url: editWebhookUrl || null, icon_url: editIconUrl || null, credit_cost: parseInt(editCreditCost), input_fields: inputFieldsData })
        .eq('id', editTool.id);
      if (error) throw error;
      toast({ title: "Success", description: "Tool updated successfully" });
      setEditTool(null); fetchTools();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update tool" });
    } finally { setEditLoading(false); }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) return <Badge variant="secondary">Inactive</Badge>;
    switch (status) {
      case 'approved': return <Badge variant="default">Approved</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderToolsList = (filterStatus: string | null = null, filterActive: boolean | null = null, underDevelopment: boolean = false) => {
    let filteredTools = tools;
    if (underDevelopment) {
      filteredTools = filteredTools.filter(tool => !tool.webhook_url || tool.webhook_url.trim() === '');
    } else {
      filteredTools = filteredTools.filter(tool => tool.webhook_url && tool.webhook_url.trim() !== '');
    }
    if (filterStatus) filteredTools = filteredTools.filter(tool => tool.approval_status === filterStatus);
    if (filterActive !== null) filteredTools = filteredTools.filter(tool => tool.is_active === filterActive);

    if (filteredTools.length === 0) return <p className="text-muted-foreground text-center py-4">No tools found</p>;

    return (
      <div className="space-y-4">
        {filteredTools.map((tool) => (
          <Card key={tool.id} className="p-4 space-y-3 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`status-dot ${
                    !tool.is_active ? 'status-dot-inactive' :
                    tool.approval_status === 'approved' ? 'status-dot-active' :
                    tool.approval_status === 'pending' ? 'status-dot-pending' :
                    'status-dot-inactive'
                  }`} />
                  <h3 className="font-semibold text-lg font-display">{tool.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(tool.approval_status, tool.is_active)}
                  <Badge variant="outline">{tool.category}</Badge>
                  <Badge variant="secondary" className="font-mono">{tool.credit_cost} credits</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewTool(tool)}><Eye className="w-4 h-4 mr-2" />Preview</Button>
              <Button variant="outline" size="sm" onClick={() => setEditTool(tool)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
              <Button variant={tool.is_active ? "secondary" : "default"} size="sm" onClick={() => handleToggleActive(tool.id, tool.is_active)}>
                {tool.is_active ? (<><PowerOff className="w-4 h-4 mr-2" />Deactivate</>) : (<><Power className="w-4 h-4 mr-2" />Activate</>)}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteToolId(tool.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>);
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Tool Management</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Tools</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="development">Under Development</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">{renderToolsList()}</TabsContent>
            <TabsContent value="active" className="mt-4">{renderToolsList(null, true)}</TabsContent>
            <TabsContent value="inactive" className="mt-4">{renderToolsList(null, false)}</TabsContent>
            <TabsContent value="approved" className="mt-4">{renderToolsList('approved')}</TabsContent>
            <TabsContent value="development" className="mt-4">{renderToolsList(null, null, true)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTool} onOpenChange={() => setPreviewTool(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tool Details</DialogTitle></DialogHeader>
          {previewTool && (
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-muted-foreground">Name</label><p className="text-lg">{previewTool.name}</p></div>
              <div><label className="text-sm font-medium text-muted-foreground">Description</label><p>{previewTool.description}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-muted-foreground">Category</label><p>{previewTool.category}</p></div>
                <div><label className="text-sm font-medium text-muted-foreground">Credit Cost</label><p>{previewTool.credit_cost}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-muted-foreground">Status</label><div className="mt-1">{getStatusBadge(previewTool.approval_status, previewTool.is_active)}</div></div>
                <div><label className="text-sm font-medium text-muted-foreground">State</label><p>{previewTool.is_active ? 'Active' : 'Inactive'}</p></div>
              </div>
              {previewTool.webhook_url && (<div><label className="text-sm font-medium text-muted-foreground">Webhook URL</label><p className="text-sm font-mono bg-muted p-2 rounded break-all">{previewTool.webhook_url}</p></div>)}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Input Fields</label>
                <div className="space-y-2 mt-2">
                  {previewTool.input_fields && Array.isArray(previewTool.input_fields) && previewTool.input_fields.length > 0 ? (
                    previewTool.input_fields.map((field: any, index: number) => (
                      <div key={index} className="border rounded p-3 bg-muted/50">
                        <p className="font-medium">{field.label}</p>
                        <p className="text-sm text-muted-foreground">Type: {field.type} | Name: {field.name} | Required: {field.required ? 'Yes' : 'No'}</p>
                        {field.placeholder && <p className="text-sm text-muted-foreground">Placeholder: {field.placeholder}</p>}
                      </div>
                    ))
                  ) : (<p className="text-sm text-muted-foreground">No input fields defined</p>)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Tool Dialog */}
      <Dialog open={!!editTool} onOpenChange={() => setEditTool(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>Update the tool configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Tool Name *</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description *</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Credit Cost</Label><Input type="number" min="1" value={editCreditCost} onChange={(e) => setEditCreditCost(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Webhook URL</Label><Input value={editWebhookUrl} onChange={(e) => setEditWebhookUrl(e.target.value)} /></div>
            <div className="space-y-2"><Label>Icon URL</Label><Input value={editIconUrl} onChange={(e) => setEditIconUrl(e.target.value)} /></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Input Fields</Label>
                <Button type="button" onClick={addEditInputField} size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Add Field</Button>
              </div>
              {editInputFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Field {index + 1}</h4>
                    {editInputFields.length > 1 && <Button type="button" onClick={() => removeEditInputField(field.id!)} size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Field Name *</Label><Input value={field.name} onChange={(e) => updateEditInputField(field.id!, "name", e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Field Type *</Label>
                      <Select value={field.type} onValueChange={(value) => updateEditInputField(field.id!, "type", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{fieldTypes.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Label *</Label><Input value={field.label} onChange={(e) => updateEditInputField(field.id!, "label", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Placeholder</Label><Input value={field.placeholder} onChange={(e) => updateEditInputField(field.id!, "placeholder", e.target.value)} /></div>
                    <div className="flex items-center space-x-2 col-span-2">
                      <input type="checkbox" id={`edit-required-${field.id}`} checked={field.required} onChange={(e) => updateEditInputField(field.id!, "required", e.target.checked)} />
                      <Label htmlFor={`edit-required-${field.id}`}>Required field</Label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTool(null)}>Cancel</Button>
            <Button onClick={handleEditTool} disabled={editLoading}>{editLoading ? "Updating..." : "Update Tool"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteToolId} onOpenChange={() => setDeleteToolId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this tool? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
