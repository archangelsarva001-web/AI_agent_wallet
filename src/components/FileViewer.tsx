import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Image as ImageIcon, File, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FileViewerProps {
  data: any;
  outputType?: string;
}

// Detect file type from data
const detectFileType = (data: any): string => {
  if (!data) return "text";
  
  // Check for base64 image
  if (typeof data === "string" && data.startsWith("data:image/")) {
    return "image";
  }
  
  // Check for URL patterns
  if (typeof data === "string") {
    const lowerData = data.toLowerCase();
    if (lowerData.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return "image";
    if (lowerData.match(/\.(pdf)$/)) return "pdf";
    if (lowerData.match(/\.(csv)$/)) return "csv";
    if (lowerData.match(/\.(xlsx|xls)$/)) return "excel";
    if (lowerData.match(/\.(html|htm)$/)) return "html";
  }
  
  // Check for structured data
  if (typeof data === "object") {
    // Check if it's CSV-like (array of objects)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
      return "csv";
    }
    return "json";
  }
  
  return "text";
};

// Parse CSV data
const parseCSV = (csvString: string): any[] => {
  const lines = csvString.trim().split("\n");
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || "";
    });
    return obj;
  });
  
  return rows;
};

export const FileViewer = ({ data, outputType = "smart" }: FileViewerProps) => {
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  
  // Determine actual file type
  const detectedType = outputType === "smart" ? detectFileType(data) : outputType;
  
  // Handle download
  const handleDownload = () => {
    let blob: Blob;
    let filename: string;
    
    switch (detectedType) {
      case "csv":
        const csvData = typeof data === "string" ? data : 
                       Array.isArray(data) ? convertToCSV(data) : JSON.stringify(data);
        blob = new Blob([csvData], { type: "text/csv" });
        filename = "output.csv";
        break;
      case "json":
        blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        filename = "output.json";
        break;
      case "html":
        blob = new Blob([data], { type: "text/html" });
        filename = "output.html";
        break;
      case "image":
        // For base64 images, create a download link
        if (typeof data === "string" && data.startsWith("data:image/")) {
          const link = document.createElement("a");
          link.href = data;
          link.download = "output.png";
          link.click();
          return;
        }
        blob = new Blob([data], { type: "image/png" });
        filename = "output.png";
        break;
      default:
        blob = new Blob([typeof data === "string" ? data : JSON.stringify(data, null, 2)], { type: "text/plain" });
        filename = "output.txt";
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Convert array of objects to CSV
  const convertToCSV = (arr: any[]): string => {
    if (!arr.length) return "";
    const headers = Object.keys(arr[0]);
    const csvRows = [
      headers.join(","),
      ...arr.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","))
    ];
    return csvRows.join("\n");
  };
  
  // Render based on file type
  const renderPreview = () => {
    switch (detectedType) {
      case "image":
        return (
          <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg">
            <img 
              src={data} 
              alt="Output" 
              className="max-w-full max-h-[500px] object-contain rounded-lg shadow-lg"
            />
          </div>
        );
        
      case "csv":
        const csvData = typeof data === "string" ? parseCSV(data) : data;
        if (!Array.isArray(csvData) || csvData.length === 0) {
          return <div className="text-muted-foreground">No data to display</div>;
        }
        
        const headers = Object.keys(csvData[0]);
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  {headers.map((header, i) => (
                    <th key={i} className="border border-border px-4 py-2 text-left font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    {headers.map((header, j) => (
                      <td key={j} className="border border-border px-4 py-2">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case "json":
        return (
          <pre className="bg-muted/30 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
        
      case "html":
        return (
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <p className="text-sm text-warning-foreground">
                HTML preview - rendered content shown below
              </p>
            </div>
            <div 
              className="bg-background border border-border rounded-lg p-4"
              dangerouslySetInnerHTML={{ __html: data }}
            />
          </div>
        );
        
      case "excel":
        return (
          <div className="text-center p-8 bg-muted/30 rounded-lg">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Excel file preview not available</p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Excel File
            </Button>
          </div>
        );
        
      case "pdf":
        return (
          <div className="text-center p-8 bg-muted/30 rounded-lg">
            <File className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">PDF preview not available</p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        );
        
      default:
        return (
          <div className="bg-muted/30 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">
              {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };
  
  // Get icon for file type
  const getFileIcon = () => {
    switch (detectedType) {
      case "image": return <ImageIcon className="h-4 w-4" />;
      case "csv": return <FileSpreadsheet className="h-4 w-4" />;
      case "json": return <Code className="h-4 w-4" />;
      case "excel": return <FileSpreadsheet className="h-4 w-4" />;
      case "html": return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="border-success/20 bg-success/5">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              {getFileIcon()}
              {detectedType.toUpperCase()}
            </Badge>
            {outputType === "smart" && (
              <Badge variant="secondary">Auto-detected</Badge>
            )}
          </div>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "raw")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            {renderPreview()}
          </TabsContent>
          
          <TabsContent value="raw" className="mt-4">
            <pre className="bg-muted/30 p-4 rounded-lg overflow-x-auto text-sm max-h-[500px] overflow-y-auto">
              {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};