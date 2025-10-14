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

// Validation function to prevent SSRF attacks
const isValidWebhookUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url) return { valid: true }; // Optional field
  
  try {
    const parsed = new URL(url);
    
    // Only allow https for security
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Webhook URL must use HTTPS protocol' };
    }
    
    // Block private IP ranges and localhost to prevent SSRF
    const hostname = parsed.hostname.toLowerCase();
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return { valid: false, error: 'Localhost URLs are not allowed' };
    }
    
    // Block private IPv4 ranges
    if (hostname.match(/^192\.168\./)) {
      return { valid: false, error: 'Private IP addresses are not allowed' };
    }
    if (hostname.match(/^10\./)) {
      return { valid: false, error: 'Private IP addresses are not allowed' };
    }
    if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return { valid: false, error: 'Private IP addresses are not allowed' };
    }
    
    // Block AWS metadata endpoint
    if (hostname === '169.254.169.254') {
      return { valid: false, error: 'Metadata endpoints are not allowed' };
    }
    
    // Block link-local addresses
    if (hostname.match(/^169\.254\./)) {
      return { valid: false, error: 'Link-local addresses are not allowed' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

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

const outputTypes = [
  { value: "smart", label: "Smart (Auto-detect)", category: "Auto" },
  
  // Text & Documents
  { value: "text", label: "Plain Text (.txt)", category: "Text & Documents" },
  { value: "markdown", label: "Markdown (.md)", category: "Text & Documents" },
  { value: "rtf", label: "Rich Text Format (.rtf)", category: "Text & Documents" },
  { value: "doc", label: "Word Document (.doc/.docx)", category: "Text & Documents" },
  { value: "odt", label: "OpenDocument Text (.odt)", category: "Text & Documents" },
  { value: "pdf", label: "PDF Document", category: "Text & Documents" },
  
  // Data Formats
  { value: "json", label: "JSON", category: "Data Formats" },
  { value: "xml", label: "XML", category: "Data Formats" },
  { value: "yaml", label: "YAML", category: "Data Formats" },
  { value: "csv", label: "CSV (Comma Separated)", category: "Data Formats" },
  { value: "tsv", label: "TSV (Tab Separated)", category: "Data Formats" },
  { value: "excel", label: "Excel (.xlsx/.xls)", category: "Data Formats" },
  
  // Images
  { value: "png", label: "PNG Image", category: "Images" },
  { value: "jpg", label: "JPEG Image", category: "Images" },
  { value: "gif", label: "GIF Image", category: "Images" },
  { value: "svg", label: "SVG Vector", category: "Images" },
  { value: "webp", label: "WebP Image", category: "Images" },
  { value: "bmp", label: "Bitmap Image", category: "Images" },
  { value: "tiff", label: "TIFF Image", category: "Images" },
  
  // Web & Code
  { value: "html", label: "HTML", category: "Web & Code" },
  { value: "css", label: "CSS", category: "Web & Code" },
  { value: "javascript", label: "JavaScript", category: "Web & Code" },
  { value: "typescript", label: "TypeScript", category: "Web & Code" },
  { value: "python", label: "Python", category: "Web & Code" },
  { value: "java", label: "Java", category: "Web & Code" },
  { value: "cpp", label: "C/C++", category: "Web & Code" },
  
  // Media
  { value: "mp4", label: "MP4 Video", category: "Media" },
  { value: "avi", label: "AVI Video", category: "Media" },
  { value: "mov", label: "MOV Video", category: "Media" },
  { value: "mp3", label: "MP3 Audio", category: "Media" },
  { value: "wav", label: "WAV Audio", category: "Media" },
  { value: "ogg", label: "OGG Audio", category: "Media" },
  
  // Archives
  { value: "zip", label: "ZIP Archive", category: "Archives" },
  { value: "tar", label: "TAR Archive", category: "Archives" },
  { value: "gz", label: "GZIP Archive", category: "Archives" },
  { value: "rar", label: "RAR Archive", category: "Archives" },
  
  // Presentations
  { value: "ppt", label: "PowerPoint (.ppt/.pptx)", category: "Presentations" },
  { value: "odp", label: "OpenDocument Presentation", category: "Presentations" },
  
  // Other
  { value: "epub", label: "EPUB eBook", category: "Other" },
  { value: "binary", label: "Binary File", category: "Other" },
  { value: "file", label: "Generic File", category: "Other" },
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
  const [outputType, setOutputType] = useState("smart");
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

    // Validate webhook URL to prevent SSRF attacks
    const webhookValidation = isValidWebhookUrl(webhookUrl);
    if (!webhookValidation.valid) {
      toast({
        variant: "destructive",
        title: "Invalid Webhook URL",
        description: webhookValidation.error,
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
        output_type: outputType,
        input_fields: inputFieldsData,
        is_active: true,
        approval_status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI tool submitted for approval. An admin will review it shortly.",
      });

      // Reset form
      setToolName("");
      setToolDescription("");
      setToolCategory("");
      setWebhookUrl("");
      setIconUrl("");
      setCreditCost("1");
      setOutputType("smart");
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

            <div className="space-y-2">
              <Label htmlFor="outputType">Output Type</Label>
              <Select value={outputType} onValueChange={setOutputType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select output type" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(
                    outputTypes.reduce((acc, type) => {
                      const cat = type.category || "Other";
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(type);
                      return acc;
                    }, {} as Record<string, typeof outputTypes>)
                  ).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose "Smart" to auto-detect the output format, or select a specific type
              </p>
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
