import { useState } from 'react'
import { Copy, Check, Loader2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { AvailableModelsResponse } from '@/types/api'

interface ModelsDialogProps {
  credentialId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  data: AvailableModelsResponse | null
  isLoading: boolean
  error: Error | null
}

export function ModelsDialog({
  credentialId,
  open,
  onOpenChange,
  data,
  isLoading,
  error,
}: ModelsDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (modelId: string) => {
    try {
      await navigator.clipboard.writeText(modelId)
      setCopiedId(modelId)
      toast.success('已复制模型 ID')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('复制失败')
    }
  }

  const formatTokenLimit = (limit?: number) => {
    if (!limit) return '—'
    if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`
    if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`
    return limit.toString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            凭据 #{credentialId} 可用模型
            {data?.subscriptionTitle && (
              <Badge variant="secondary" className="text-xs">
                {data.subscriptionTitle}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="text-center">
                <div className="font-medium text-destructive">加载失败</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {error.message}
                </div>
              </div>
            </div>
          )}

          {data && data.availableModels.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              暂无可用模型
            </div>
          )}

          {data && data.availableModels.length > 0 && (
            <div className="space-y-2">
              {data.availableModels.map((model) => (
                <div
                  key={model.modelId}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {model.modelName}
                        </span>
                        {model.supportedInputTypes.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {model.supportedInputTypes.map((type) => (
                              <Badge
                                key={type}
                                variant="outline"
                                className="text-xs px-1.5 py-0"
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className="font-mono text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1.5"
                        onClick={() => handleCopy(model.modelId)}
                        title="点击复制模型 ID"
                      >
                        <span className="truncate">{model.modelId}</span>
                        {copiedId === model.modelId ? (
                          <Check className="h-3 w-3 text-green-500 shrink-0" />
                        ) : (
                          <Copy className="h-3 w-3 shrink-0" />
                        )}
                      </div>
                      {model.description && (
                        <div className="text-xs text-muted-foreground">
                          {model.description}
                        </div>
                      )}
                      {model.tokenLimits && (
                        <div className="flex gap-3 mt-2 text-xs">
                          {model.tokenLimits.maxInputTokens && (
                            <span className="text-muted-foreground">
                              输入: {formatTokenLimit(model.tokenLimits.maxInputTokens)}
                            </span>
                          )}
                          {model.tokenLimits.maxOutputTokens && (
                            <span className="text-muted-foreground">
                              输出: {formatTokenLimit(model.tokenLimits.maxOutputTokens)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
