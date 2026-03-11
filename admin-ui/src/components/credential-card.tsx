import { useState } from 'react'
import { toast } from 'sonner'
import {
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Trash2,
  Loader2,
  Check,
  X,
  Edit2,
  TrendingUp,
  TrendingDown,
  Globe,
  Clock,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  CredentialStatusItem,
  CachedBalanceInfo,
  BalanceResponse,
} from '@/types/api'
import {
  useSetDisabled,
  useSetPriority,
  useSetRegion,
  useResetFailure,
  useDeleteCredential,
} from '@/hooks/use-credentials'

interface CredentialCardProps {
  credential: CredentialStatusItem
  cachedBalance?: CachedBalanceInfo
  selected: boolean
  onToggleSelect: () => void
  balance: BalanceResponse | null
  loadingBalance: boolean
  onViewModels: (id: number) => void
}

function formatLastUsed(lastUsedAt: string | null): string {
  if (!lastUsedAt) return '从未使用'
  const date = new Date(lastUsedAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 0) return '刚刚'
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds} 秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export function CredentialCard({
  credential,
  cachedBalance,
  selected,
  onToggleSelect,
  balance,
  loadingBalance,
  onViewModels,
}: CredentialCardProps) {
  const [editingPriority, setEditingPriority] = useState(false)
  const [priorityValue, setPriorityValue] = useState(
    String(credential.priority),
  )
  const [editingRegion, setEditingRegion] = useState(false)
  const [regionValue, setRegionValue] = useState(credential.region ?? '')
  const [apiRegionValue, setApiRegionValue] = useState(
    credential.apiRegion ?? '',
  )
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const setDisabled = useSetDisabled()
  const setPriority = useSetPriority()
  const setRegion = useSetRegion()
  const resetFailure = useResetFailure()
  const deleteCredential = useDeleteCredential()

  const handleToggleDisabled = () => {
    setDisabled.mutate(
      { id: credential.id, disabled: !credential.disabled },
      {
        onSuccess: (res) => {
          toast.success(res.message)
        },
        onError: (err) => {
          toast.error('操作失败: ' + (err as Error).message)
        },
      },
    )
  }

  const handlePriorityChange = () => {
    const newPriority = parseInt(priorityValue, 10)
    if (isNaN(newPriority) || newPriority < 0) {
      toast.error('优先级必须是非负整数')
      return
    }
    setPriority.mutate(
      { id: credential.id, priority: newPriority },
      {
        onSuccess: (res) => {
          toast.success(res.message)
          setEditingPriority(false)
        },
        onError: (err) => {
          toast.error('操作失败: ' + (err as Error).message)
        },
      },
    )
  }

  const handleRegionChange = () => {
    setRegion.mutate(
      {
        id: credential.id,
        region: regionValue.trim() || null,
        apiRegion: apiRegionValue.trim() || null,
      },
      {
        onSuccess: (res) => {
          toast.success(res.message)
          setEditingRegion(false)
        },
        onError: (err) => {
          toast.error('操作失败: ' + (err as Error).message)
        },
      },
    )
  }

  const handleReset = () => {
    resetFailure.mutate(credential.id, {
      onSuccess: (res) => {
        toast.success(res.message)
      },
      onError: (err) => {
        toast.error('操作失败: ' + (err as Error).message)
      },
    })
  }

  const handleDelete = () => {
    if (!credential.disabled) {
      toast.error('请先禁用凭据再删除')
      setShowDeleteDialog(false)
      return
    }

    deleteCredential.mutate(credential.id, {
      onSuccess: (res) => {
        toast.success(res.message)
        setShowDeleteDialog(false)
      },
      onError: (err) => {
        toast.error('删除失败: ' + (err as Error).message)
      },
    })
  }

  // 格式化缓存时间（相对时间）
  const formatCacheAge = (cachedAt: number) => {
    const now = Date.now()
    const diff = now - cachedAt
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `${seconds}秒前`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟前`
    return `${Math.floor(minutes / 60)}小时前`
  }

  // 格式化重置时间
  const formatResetTime = (timestamp: number | null) => {
    if (!timestamp) return '未知'
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = date.getTime() - now.getTime()

    if (diff < 0) return '已过期'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}天${hours}小时后重置`
    if (hours > 0) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}小时${minutes}分钟后重置`
    }
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes}分钟后重置`
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Checkbox
                checked={selected}
                onCheckedChange={onToggleSelect}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                  <span className="truncate">
                    {credential.email || `凭据 #${credential.id}`}
                  </span>
                  {credential.disabled && (
                    <Badge variant="destructive" className="text-xs">
                      已禁用
                    </Badge>
                  )}
                  {credential.hasProfileArn && (
                    <Badge variant="secondary" className="text-xs">
                      Profile ARN
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    成功 {credential.successCount}
                  </span>
                  {credential.failureCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <TrendingDown className="h-3 w-3" />
                      失败 {credential.failureCount}
                    </span>
                  )}
                  <span>最后使用: {formatLastUsed(credential.lastUsedAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">启用</span>
              <Switch
                checked={!credential.disabled}
                onCheckedChange={handleToggleDisabled}
                disabled={setDisabled.isPending}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-2 gap-2">
            {/* 优先级 */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="text-xs text-muted-foreground">优先级</div>
              {editingPriority ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={priorityValue}
                    onChange={(e) => setPriorityValue(e.target.value)}
                    className="h-7 text-sm flex-1"
                    min="0"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 cursor-pointer"
                    onClick={handlePriorityChange}
                    disabled={setPriority.isPending}
                    title="保存优先级"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 cursor-pointer"
                    onClick={() => {
                      setEditingPriority(false)
                      setPriorityValue(String(credential.priority))
                    }}
                    title="取消编辑"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <span className="text-lg font-semibold">
                    {credential.priority}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => setEditingPriority(true)}
                    title="编辑优先级"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* 订阅等级 */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="text-xs text-muted-foreground">订阅等级</div>
              <div className="text-lg font-semibold truncate">
                {loadingBalance ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  balance?.subscriptionTitle || '未知'
                )}
              </div>
            </div>

            {/* 剩余用量 */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 col-span-2">
              <div className="text-xs text-muted-foreground">剩余用量</div>
              {loadingBalance ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">加载中...</span>
                </div>
              ) : balance ? (
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold">
                      {balance.remaining.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {balance.usageLimit.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        balance.usagePercentage > 80
                          ? 'bg-red-500'
                          : balance.usagePercentage > 50
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(100 - balance.usagePercentage, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {(100 - balance.usagePercentage).toFixed(1)}% 剩余
                    </span>
                    {balance.nextResetAt && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatResetTime(balance.nextResetAt)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">未知</span>
              )}
            </div>

            {/* 余额 */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 col-span-2">
              <div className="text-xs text-muted-foreground">余额</div>
              {cachedBalance && cachedBalance.ttlSecs > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-lg font-semibold ${cachedBalance.remaining > 0 ? 'text-green-600' : 'text-red-500'}`}
                  >
                    ${cachedBalance.remaining.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    缓存于 {formatCacheAge(cachedBalance.cachedAt)}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          {/* Region 配置 */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Region 配置
            </div>
            {editingRegion ? (
              <div className="flex items-center gap-1 flex-wrap">
                <Input
                  placeholder="Region（留空清除）"
                  value={regionValue}
                  onChange={(e) => setRegionValue(e.target.value)}
                  className="h-7 text-sm flex-1 min-w-[120px]"
                  autoFocus
                />
                <Input
                  placeholder="API Region（可选）"
                  value={apiRegionValue}
                  onChange={(e) => setApiRegionValue(e.target.value)}
                  className="h-7 text-sm flex-1 min-w-[140px]"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 cursor-pointer"
                  onClick={handleRegionChange}
                  disabled={setRegion.isPending}
                  title="保存 Region 配置"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 cursor-pointer"
                  onClick={() => {
                    setEditingRegion(false)
                    setRegionValue(credential.region ?? '')
                    setApiRegionValue(credential.apiRegion ?? '')
                  }}
                  title="取消编辑"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <div className="text-sm">
                  <span className="font-medium">
                    {credential.region || '全局默认'}
                  </span>
                  {credential.apiRegion && (
                    <span className="text-muted-foreground ml-1">
                      / API: {credential.apiRegion}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => {
                    setRegionValue(credential.region ?? '')
                    setApiRegionValue(credential.apiRegion ?? '')
                    setEditingRegion(true)
                  }}
                  title="编辑 Region 配置"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* 代理信息 */}
          {credential.hasProxy && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="text-xs text-muted-foreground">代理配置</div>
              <div className="text-sm font-mono truncate">
                {credential.proxyUrl}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-1 pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              disabled={resetFailure.isPending || credential.failureCount === 0}
              className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
              title="重置失败计数"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const newPriority = Math.max(0, credential.priority - 1)
                setPriority.mutate(
                  { id: credential.id, priority: newPriority },
                  {
                    onSuccess: (res) => toast.success(res.message),
                    onError: (err) =>
                      toast.error('操作失败: ' + (err as Error).message),
                  },
                )
              }}
              disabled={setPriority.isPending || credential.priority === 0}
              className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
              title="提高优先级（数字越小优先级越高）"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const newPriority = credential.priority + 1
                setPriority.mutate(
                  { id: credential.id, priority: newPriority },
                  {
                    onSuccess: (res) => toast.success(res.message),
                    onError: (err) =>
                      toast.error('操作失败: ' + (err as Error).message),
                  },
                )
              }}
              disabled={setPriority.isPending}
              className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
              title="降低优先级（数字越大优先级越低）"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewModels(credential.id)}
              className="h-8 w-8 p-0 cursor-pointer"
              title="查看可用模型列表"
            >
              <Layers className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              disabled={!credential.disabled}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer disabled:cursor-not-allowed"
              title={
                !credential.disabled ? '需要先禁用凭据才能删除' : '删除凭据'
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除凭据</DialogTitle>
            <DialogDescription>
              您确定要删除凭据 #{credential.id} 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteCredential.isPending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCredential.isPending || !credential.disabled}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
