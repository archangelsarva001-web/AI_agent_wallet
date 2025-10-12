import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InputField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "date", label: "Date" },
  { value: "file", label: "File Upload" },
];

const categories = [
  "Text Processing",
  "Image Generation",
  "Language Processing",
  "Development",
  "Marketing",
  "Communication",
  "Sales"
];

export const ToolCreationForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolCategory, setToolCategory] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [creditCost, setCreditCost] = useState("1");
  const [inputFields, setInputFields] = useState<InputField[]>([
    {
      id: crypto.randomUUID(),
      name: "",
      type: "text",
      label: "",
      placeholder: "",
      required: true,
    },
  ]);

  const addInputField = () => {
    setInputFields([
      ...inputFields,
      {
        id: crypto.randomUUID(),
        name: "",
        type: "text",
        label: "",
        placeholder: "",
        required: true,
      },
    ]);
  };

  const removeInputField = (id: string) => {
    if (inputFields.length > 1) {
      setInputFields(inputFields.filter((field) => field.id !== id));
    }
  };

  const updateInputField = (id: string, key: keyof InputField, value: any) => {
    setInputFields(
      inputFields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate fields
    if (!toolName || !toolDescription || !toolCategory || !webhookUrl) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      });
      setLoading(false);
      return;
    }

    // Validate input fields
    for (const field of inputFields) {
      if (!field.name || !field.label) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "All input fields must have a name and label",
        });
        setLoading(false);
        return;
      }
    }

    try {
      // Transform input fields to the format expected by the database
      const inputFieldsData = inputFields.map(({ id, ...field }) => field);

      const { error } = await supabase.from("ai_tools").insert({
        name: toolName,
        description: toolDescription,
        category: toolCategory,
        webhook_url: webhookUrl,
        icon_url: iconUrl || null,
        credit_cost: parseInt(creditCost),
        input_fields: inputFieldsData,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI tool created successfully",
      });

      // Reset form
      setToolName("");
      setToolDescription("");
      setToolCategory("");
      setWebhookUrl("");
      setIconUrl("");
      setCreditCost("1");
      setInputFields([
        {
          id: crypto.randomUUID(),
          name: "",
          type: "text",
          label: "",
          placeholder: "",
          required: true,
        },
      ]);
    } catch (error: any) {
      console.error("Error creating tool:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create AI tool",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New AI Tool</CardTitle>
        <CardDescription>
          Configure a new AI tool with custom input fields and webhook integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="toolName">Tool Name *</Label>
              <Input
                id="toolName"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="e.g., LinkedIn Post Generator"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toolDescription">Description *</Label>
              <Textarea
                id="toolDescription"
                value={toolDescription}
                onChange={(e) => setToolDescription(e.target.value)}
                placeholder="Describe what this tool does..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toolCategory">Category *</Label>
                <Select value={toolCategory} onValueChange={setToolCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditCost">Credit Cost *</Label>
                <Input
                  id="creditCost"
                  type="number"
                  min="1"
                  value={creditCost}
                  onChange={(e) => setCreditCost(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL *</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-webhook-endpoint.com/api"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iconUrl">Icon URL (optional)</Label>
              <Input
                id="iconUrl"
                type="url"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://example.com/icon.png"
              />
            </div>
          </div>

          {/* Input Fields Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Input Fields</h3>
              <Button type="button" onClick={addInputField} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {inputFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium">Field {index + 1}</h4>
                  {inputFields.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeInputField(field.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Field Name *</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateInputField(field.id, "name", e.target.value)}
                      placeholder="e.g., topic"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Field Type *</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => updateInputField(field.id, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Label *</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateInputField(field.id, "label", e.target.value)}
                      placeholder="e.g., Topic"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Placeholder</Label>
                    <Input
                      value={field.placeholder}
                      onChange={(e) => updateInputField(field.id, "placeholder", e.target.value)}
                      placeholder="e.g., Enter topic..."
                    />
                  </div>

                  <div className="flex items-center space-x-2 col-span-2">
                    <input
                      type="checkbox"
                      id={`required-${field.id}`}
                      checked={field.required}
                      onChange={(e) => updateInputField(field.id, "required", e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`required-${field.id}`}>Required field</Label>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Tool...
              </>
            ) : (
              "Create AI Tool"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
