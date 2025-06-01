import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Archive, 
  HardDrive, 
  TrendingDown, 
  BarChart3,
  Zap,
  CheckCircle
} from 'lucide-react';
import { KnowledgeBaseService } from '@/services/knowledgeBaseService';

interface CompressionStatsData {
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavings: number;
  averageCompressionRatio: number;
  formattedStats: {
    totalOriginalSize: string;
    totalCompressedSize: string;
    totalSavings: string;
  };
}

export function CompressionStats() {
  const [stats, setStats] = useState<CompressionStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const statsData = await KnowledgeBaseService.getCompressionStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load compression stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Compression Statistics
          </CardTitle>
          <CardDescription>Loading storage efficiency data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Compression Statistics
          </CardTitle>
          <CardDescription>No compression data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Upload some files to see compression statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const compressionEfficiency = stats.averageCompressionRatio;
  const storageUtilization = stats.totalOriginalSize > 0 
    ? (stats.totalCompressedSize / stats.totalOriginalSize) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.formattedStats.totalSavings}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compression Ratio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {compressionEfficiency.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Archive className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Original Size</p>
                <p className="text-2xl font-bold text-gray-700">
                  {stats.formattedStats.totalOriginalSize}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compressed Size</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.formattedStats.totalCompressedSize}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Storage Efficiency Analysis
          </CardTitle>
          <CardDescription>
            Detailed breakdown of compression performance and storage optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compression Efficiency */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Compression Efficiency</span>
              <Badge variant={compressionEfficiency > 50 ? "default" : compressionEfficiency > 30 ? "secondary" : "outline"}>
                {compressionEfficiency > 50 ? "Excellent" : compressionEfficiency > 30 ? "Good" : "Fair"}
              </Badge>
            </div>
            <Progress value={compressionEfficiency} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              Average {compressionEfficiency.toFixed(1)}% reduction in file size
            </p>
          </div>

          {/* Storage Utilization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Storage Utilization</span>
              <span className="text-sm text-gray-600">
                {storageUtilization.toFixed(1)}% of original
              </span>
            </div>
            <Progress value={100 - storageUtilization} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              Using {storageUtilization.toFixed(1)}% of original storage space
            </p>
          </div>

          {/* Benefits Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Compression Benefits</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-700">Storage Savings</p>
                <p className="text-green-600">
                  {stats.formattedStats.totalSavings} saved
                </p>
              </div>
              <div>
                <p className="font-medium text-green-700">Cost Efficiency</p>
                <p className="text-green-600">
                  ~{compressionEfficiency.toFixed(0)}% cost reduction
                </p>
              </div>
              <div>
                <p className="font-medium text-green-700">Performance</p>
                <p className="text-green-600">
                  Faster transfers & backups
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Technical Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Compression Algorithm</p>
                <p className="font-medium">Zlib (Level 9) + Type-specific optimization</p>
              </div>
              <div>
                <p className="text-gray-600">AI Compatibility</p>
                <p className="font-medium">Lossless text extraction preserved</p>
              </div>
              <div>
                <p className="text-gray-600">Original Preservation</p>
                <p className="font-medium">Critical files automatically preserved</p>
              </div>
              <div>
                <p className="text-gray-600">Decompression</p>
                <p className="font-medium">On-demand, transparent to users</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {compressionEfficiency < 30 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Optimization Recommendations</CardTitle>
            <CardDescription className="text-yellow-700">
              Your compression efficiency could be improved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Consider uploading more text-based files (PDFs, documents) for better compression</li>
              <li>• Large media files (videos, images) have limited compression potential</li>
              <li>• Use appropriate file formats for your content type</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 