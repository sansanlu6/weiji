import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Filter,
  X,
  Trash2,
  Square,
  CheckSquare,
  Archive,
  ChevronLeft,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DateField from '@/components/ui/DateField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
import PageBackground from '@client/src/components/PageBackground';
import { Image } from '@client/src/components/ui/image';
import ExportDialog from '@/components/ExportDialog';
import {
   RecordItem,
   RecycleItem,
   PaginationControl,
   EmptyState,
   TYPE_OPTIONS,
   groupRecordsByDate,
 } from './DataRecordItems';
import RecordDetailDialog from './RecordDetailDialog';
import {
  searchRecords,
  getRecycleBin,
  restoreRecord,
  permanentDelete,
  batchDelete,
  batchRestore,
  batchPermanentDelete,
} from '@/api/data';
import type { UnifiedRecord, RecycleRecord } from '@shared/api.interface';
import osmanthusBranch from '@client/src/assets/osmanthus-branch.png';

type TabKey = 'all' | 'recycle';

const PAGE_SIZE = 20;

const DataPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // 筛选状态
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState<string>('');
  const [appliedType, setAppliedType] = useState<string | undefined>(undefined);
  const [appliedStart, setAppliedStart] = useState<string>('');
  const [appliedEnd, setAppliedEnd] = useState<string>('');

  // 列表状态
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // 批量选择
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 回收站
  const [recycleRecords, setRecycleRecords] = useState<RecycleRecord[]>([]);
  const [recycleTotal, setRecycleTotal] = useState<number>(0);
  const [recyclePage, setRecyclePage] = useState<number>(1);
  const [recycleType, setRecycleType] = useState<string | undefined>(undefined);
  const [recycleKeyword, setRecycleKeyword] = useState<string>('');
  const [appliedRecycleKeyword, setAppliedRecycleKeyword] = useState<string>('');
  const [appliedRecycleType, setAppliedRecycleType] = useState<string | undefined>(undefined);
  const [recycleFilterOpen, setRecycleFilterOpen] = useState<boolean>(false);
  const [recycleBatchMode, setRecycleBatchMode] = useState<boolean>(false);
  const [recycleSelectedIds, setRecycleSelectedIds] = useState<Set<string>>(new Set());

  const filterPanelRef = useRef<HTMLDivElement>(null);
  const recycleFilterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const targetEl = target as HTMLElement;
      if (targetEl.closest?.('[data-slot="select-content"]')) return;
      if (targetEl.closest?.('[data-slot="select-trigger"]')) return;
      if (targetEl.closest?.('[data-slot="popover-content"]')) return;
      if (targetEl.closest?.('[data-slot="popover-trigger"]')) return;
      if (targetEl.closest?.('[role="dialog"]')) return;

      if (filterOpen && filterPanelRef.current && !filterPanelRef.current.contains(target)) {
        setFilterOpen(false);
      }
      if (recycleFilterOpen && recycleFilterPanelRef.current && !recycleFilterPanelRef.current.contains(target)) {
        setRecycleFilterOpen(false);
      }
    };
    if (filterOpen || recycleFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filterOpen, recycleFilterOpen]);

  // 弹窗
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: string;
    id: string;
  }>({ open: false, type: '', id: '' });
  const [selectedDetailRecord, setSelectedDetailRecord] =
    useState<UnifiedRecord | null>(null);

  const fetchRecords = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: {
        keyword?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        page: number;
        pageSize: number;
      } = { page, pageSize: PAGE_SIZE };
      if (appliedKeyword) params.keyword = appliedKeyword;
      if (appliedType) params.type = appliedType;
      if (appliedStart) params.startDate = appliedStart;
      if (appliedEnd) params.endDate = appliedEnd;

      const result = await searchRecords(params);
      setRecords(result.items);
      setTotal(result.total);
    } catch (err) {
      logger.error('fetch records failed', err instanceof Error ? err.message : String(err));
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, [page, appliedKeyword, appliedType, appliedStart, appliedEnd]);

  const fetchRecycleBin = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: { keyword?: string; type?: string; page: number; pageSize: number } = {
        page: recyclePage,
        pageSize: PAGE_SIZE,
      };
      if (appliedRecycleKeyword) params.keyword = appliedRecycleKeyword;
      if (appliedRecycleType) params.type = appliedRecycleType;

      const result = await getRecycleBin(params);
      setRecycleRecords(result.items);
      setRecycleTotal(result.total);
    } catch (err) {
      logger.error('fetch recycle bin failed', err instanceof Error ? err.message : String(err));
      toast.error('加载回收站失败');
    } finally {
      setLoading(false);
    }
  }, [recyclePage, appliedRecycleKeyword, appliedRecycleType]);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchRecords();
    }
  }, [activeTab, fetchRecords]);

  useEffect(() => {
    if (activeTab === 'recycle') {
      fetchRecycleBin();
    }
  }, [activeTab, fetchRecycleBin]);

  const handleSearch = (): void => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('开始日期不能晚于结束日期');
      return;
    }
    setAppliedKeyword(keyword.trim());
    setAppliedType(typeFilter);
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setPage(1);
  };

  const handleReset = (): void => {
    setKeyword('');
    setTypeFilter(undefined);
    setStartDate('');
    setEndDate('');
    setAppliedKeyword('');
    setAppliedType(undefined);
    setAppliedStart('');
    setAppliedEnd('');
    setPage(1);
  };

  const handleTabChange = (tab: TabKey): void => {
    setActiveTab(tab);
    setBatchMode(false);
    setSelectedIds(new Set());
    setRecycleBatchMode(false);
    setRecycleSelectedIds(new Set());
    if (tab === 'all') {
      setPage(1);
    } else {
      setRecyclePage(1);
    }
  };

  const toggleSelectAll = (): void => {
    if (selectedIds.size === records.length && records.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r: UnifiedRecord) => r.id)));
    }
  };

  const toggleSelectOne = (id: string): void => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBatchDelete = async (): Promise<void> => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await batchDelete(appliedType || 'all', ids);
      toast.success(`已删除 ${ids.length} 条记录`);
      setSelectedIds(new Set());
      setBatchMode(false);
      fetchRecords();
    } catch (err) {
      logger.error('batch delete failed', err instanceof Error ? err.message : String(err));
      toast.error('删除失败');
    }
  };

  const handleSoftDelete = async (record: UnifiedRecord): Promise<void> => {
    try {
      await batchDelete(record.type, [record.id]);
      toast.success('已移入回收站');
      fetchRecords();
    } catch (err) {
      logger.error('soft delete failed', err instanceof Error ? err.message : String(err));
      toast.error('删除失败');
    }
  };

  const handleRestore = async (record: RecycleRecord): Promise<void> => {
    try {
      await restoreRecord(record.type, record.id);
      toast.success('已恢复');
      fetchRecycleBin();
    } catch (err) {
      logger.error('restore failed', err instanceof Error ? err.message : String(err));
      toast.error('恢复失败');
    }
  };

  const openPermanentDelete = (type: string, id: string): void => {
    setDeleteConfirm({ open: true, type, id });
  };

  const handlePermanentDelete = async (): Promise<void> => {
    if (deleteConfirm.id === '__batch__') {
      await handleBatchPermanentDelete();
      return;
    }
    try {
      await permanentDelete(deleteConfirm.type, deleteConfirm.id);
      toast.success('已永久删除');
      setDeleteConfirm({ open: false, type: '', id: '' });
      fetchRecycleBin();
    } catch (err) {
      logger.error('permanent delete failed', err instanceof Error ? err.message : String(err));
      toast.error('删除失败');
    }
  };

  const handleRecycleSearch = (): void => {
    setAppliedRecycleKeyword(recycleKeyword.trim());
    setAppliedRecycleType(recycleType);
    setRecycleFilterOpen(false);
    setRecyclePage(1);
  };

  const handleRecycleReset = (): void => {
    setRecycleKeyword('');
    setRecycleType(undefined);
    setAppliedRecycleKeyword('');
    setAppliedRecycleType(undefined);
    setRecyclePage(1);
  };

  const toggleRecycleSelectAll = (): void => {
    if (recycleSelectedIds.size === recycleRecords.length && recycleRecords.length > 0) {
      setRecycleSelectedIds(new Set());
    } else {
      setRecycleSelectedIds(new Set(recycleRecords.map((r: RecycleRecord) => r.id)));
    }
  };

  const toggleRecycleSelectOne = (id: string): void => {
    const next = new Set(recycleSelectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setRecycleSelectedIds(next);
  };

  const handleBatchRestore = async (): Promise<void> => {
    if (recycleSelectedIds.size === 0) return;
    const ids = Array.from(recycleSelectedIds);
    const type = appliedRecycleType || 'all';
    if (type === 'all') {
      toast.error('请先筛选具体类型再批量恢复');
      return;
    }
    try {
      await batchRestore(type, ids);
      toast.success(`已恢复 ${ids.length} 条记录`);
      setRecycleSelectedIds(new Set());
      setRecycleBatchMode(false);
      fetchRecycleBin();
    } catch (err) {
      logger.error('batch restore failed', err instanceof Error ? err.message : String(err));
      toast.error('批量恢复失败');
    }
  };

  const openBatchPermanentDelete = (): void => {
    if (recycleSelectedIds.size === 0) return;
    const type = appliedRecycleType || 'all';
    if (type === 'all') {
      toast.error('请先筛选具体类型再批量删除');
      return;
    }
    setDeleteConfirm({ open: true, type, id: '__batch__' });
  };

  const handleBatchPermanentDelete = async (): Promise<void> => {
    const ids = Array.from(recycleSelectedIds);
    const type = appliedRecycleType || '';
    if (!type || ids.length === 0) return;
    try {
      await batchPermanentDelete(type, ids);
      toast.success(`已永久删除 ${ids.length} 条记录`);
      setDeleteConfirm({ open: false, type: '', id: '' });
      setRecycleSelectedIds(new Set());
      setRecycleBatchMode(false);
      fetchRecycleBin();
    } catch (err) {
      logger.error('batch permanent delete failed', err instanceof Error ? err.message : String(err));
      toast.error('批量删除失败');
    }
  };

  const totalPages = activeTab === 'all'
    ? Math.max(1, Math.ceil(total / PAGE_SIZE))
    : Math.max(1, Math.ceil(recycleTotal / PAGE_SIZE));

  const currentPage = activeTab === 'all' ? page : recyclePage;

  const handlePageChange = (newPage: number): void => {
    if (activeTab === 'all') {
      setPage(newPage);
    } else {
      setRecyclePage(newPage);
    }
  };

  const allSelected = records.length > 0 && selectedIds.size === records.length;
  const recycleAllSelected = recycleRecords.length > 0 && recycleSelectedIds.size === recycleRecords.length;

   return (
     <div className="relative min-h-screen font-sans-hei">
       <PageBackground />
       <div
         className="pointer-events-none"
         style={{
           position: 'absolute',
           zIndex: 0,
           top: '-45px',
           right: '-55px',
           width: '320px',
           maxWidth: '78vw',
           opacity: 0.9,
           pointerEvents: 'none',
           transformOrigin: 'top right',
           transform: 'translateX(-100%) scaleX(-1) rotate(15deg)',
         }}
         aria-hidden="true"
       >
         <Image
           src={osmanthusBranch}
           alt=""
           style={{
             width: '100%',
             height: 'auto',
             display: 'block',
             objectFit: 'contain',
           }}
         />
       </div>
        <div className="page-content-wrap relative">
       <div className="space-y-5 relative z-10">
      {/* 标题 */}
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile', { replace: true })}
          className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
          aria-label="返回"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight font-sans-hei">数据管理</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            管理你的所有记录
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="flex p-1.5"
        style={{
          backgroundColor: '#fef9e7',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(214, 178, 76, 0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className="flex-1 py-2 px-4 text-sm font-sans-hei transition-all"
          style={{
            borderRadius: '12px',
            fontWeight: activeTab === 'all' ? 600 : 500,
            color: activeTab === 'all' ? '#6b5a3e' : '#9e8f6e',
            backgroundColor: activeTab === 'all' ? '#fef3c7' : 'transparent',
            boxShadow: activeTab === 'all' ? '0 2px 6px rgba(214, 178, 76, 0.12)' : 'none',
          }}
        >
          全部记录
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('recycle')}
          className="flex-1 py-2 px-4 text-sm font-sans-hei transition-all"
          style={{
            borderRadius: '12px',
            fontWeight: activeTab === 'recycle' ? 600 : 500,
            color: activeTab === 'recycle' ? '#6b5a3e' : '#9e8f6e',
            backgroundColor: activeTab === 'recycle' ? '#fef3c7' : 'transparent',
            boxShadow: activeTab === 'recycle' ? '0 2px 6px rgba(214, 178, 76, 0.12)' : 'none',
          }}
        >
          回收站
        </button>
      </div>

      {/* 全部记录 Tab */}
      {activeTab === 'all' && (
        <>
          {/* 搜索筛选区 */}
          <div className="relative flex gap-2 items-center mb-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                strokeWidth={1.8}
              />
              <Input
                value={keyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="搜索记录..."
                className="pl-11 pr-4 rounded-2xl h-12 bg-white border-transparent focus-visible:ring-0 focus-visible:border-primary/40 text-sm shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="shrink-0 flex items-center justify-center rounded-2xl bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
              style={{ width: '52px', height: '48px' }}
            >
              <Filter className="w-5 h-5 text-primary" strokeWidth={2} />
            </button>

           {filterOpen && (
            <div
              ref={filterPanelRef}
              className="absolute top-full left-0 right-0 z-20 paper-card p-5 space-y-4 mt-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '20px',
                boxShadow: '0 12px 32px rgba(39, 71, 55, 0.1)',
              }}
            >
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               <div>
                   <label className="text-sm text-muted-foreground mb-1 block">类型</label>
                    <Select value={typeFilter} onValueChange={(val: string) => setTypeFilter(val)}>
                      <SelectTrigger className="w-full rounded-full h-11 text-sm">
                        <SelectValue placeholder="全部类型" />
                     </SelectTrigger>
                   <SelectContent>
                     {TYPE_OPTIONS.map((opt) => (
                       <SelectItem key={opt.value || 'all'} value={opt.value}>
                         {opt.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                  <label className="text-sm text-muted-foreground mb-1 block">开始日期</label>
                    <DateField
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="选择开始日期"
                    />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">结束日期</label>
                    <DateField
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="选择结束日期"
                    />
                </div>
             </div>

             <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="rounded-full text-xs px-4"
                  style={{ color: '#427c5a' }}
                >
                 <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
                 重置
               </Button>
                <Button
                  onClick={() => {
                    handleSearch();
                    setFilterOpen(false);
                  }}
                  className="rounded-full text-xs px-4 text-white"
                  style={{ backgroundColor: '#62bd7f' }}
                >
                  <Filter className="w-3.5 h-3.5" strokeWidth={1.8} />
                  筛选
                </Button>
             </div>
           </div>
          )}
          </div>

          {/* 操作栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {batchMode ? (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary" strokeWidth={1.8} />
                  ) : (
                    <Square className="w-5 h-5" strokeWidth={1.8} />
                  )}
                  <span>全选</span>
                </button>
              ) : (
                <span className="text-sm text-muted-foreground tabular-nums">
                  共 {total} 条记录
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {batchMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBatchMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="rounded-full text-xs"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.8} />
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={selectedIds.size === 0}
                    className="rounded-full text-xs bg-destructive hover:bg-destructive/90"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                    删除({selectedIds.size})
                  </Button>
                </>
              ) : (
                 <>
                   <button
                     type="button"
                     onClick={() => setBatchMode(true)}
                     className="text-sm font-medium transition-colors hover:opacity-70"
                     style={{ color: '#2a483a' }}
                   >
                     批量选择
                   </button>
                 </>
               )}
            </div>
          </div>

          {/* 记录列表：按日期分组 */}
          {loading && records.length === 0 ? (
            <div className="paper-card p-10 text-center text-sm text-muted-foreground" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>加载中...</div>
          ) : records.length === 0 ? (
            <div className="paper-card p-10" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}><EmptyState /></div>
          ) : (
            <div className="space-y-5">
              {groupRecordsByDate(records).map((group) => (
                <div key={group.dateKey}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-sm font-medium" style={{ color: '#5a7a68' }}>
                      {group.label}
                    </span>
                  </div>
                  <div
                    className="bg-white/70 backdrop-blur-md overflow-hidden"
                    style={{
                      borderRadius: '20px',
                      boxShadow: '0 2px 12px rgba(39, 71, 55, 0.04)',
                    }}
                  >
                    {group.records.map((record: UnifiedRecord, idx: number) => (
                      <div
                        key={record.id}
                        style={{
                          borderTop: idx === 0 ? 'none' : '1px solid #f0f5f2',
                        }}
                      >
                        <RecordItem
                          record={record}
                          batchMode={batchMode}
                          selected={selectedIds.has(record.id)}
                          onToggleSelect={toggleSelectOne}
                          onDelete={handleSoftDelete}
                          onClick={setSelectedDetailRecord}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* 回收站 Tab */}
      {activeTab === 'recycle' && (
        <>
          {/* 搜索筛选区 */}
          <div className="relative flex gap-2 items-center mb-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                strokeWidth={1.8}
              />
              <Input
                value={recycleKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecycleKeyword(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleRecycleSearch();
                }}
                placeholder="搜索记录..."
                className="pl-11 pr-4 rounded-2xl h-12 bg-white border-transparent focus-visible:ring-0 focus-visible:border-primary/40 text-sm shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setRecycleFilterOpen((o) => !o)}
              className="shrink-0 flex items-center justify-center rounded-2xl bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
              style={{ width: '52px', height: '48px' }}
            >
              <Filter className="w-5 h-5 text-primary" strokeWidth={2} />
            </button>

          {recycleFilterOpen && (
            <div
              ref={recycleFilterPanelRef}
              className="absolute top-full left-0 right-0 z-20 paper-card p-5 space-y-4 mt-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '20px',
                boxShadow: '0 12px 32px rgba(39, 71, 55, 0.1)',
              }}
            >
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               <div>
                   <label className="text-sm text-muted-foreground mb-1 block">类型</label>
                   <Select value={recycleType} onValueChange={(val: string) => setRecycleType(val)}>
                     <SelectTrigger className="w-full rounded-full h-11 text-sm">
                       <SelectValue placeholder="全部类型" />
                     </SelectTrigger>
                   <SelectContent>
                     {TYPE_OPTIONS.map((opt) => (
                       <SelectItem key={opt.value || 'all'} value={opt.value}>
                         {opt.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>

             <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleRecycleReset}
                  className="rounded-full text-xs px-4"
                  style={{ color: '#338354' }}
                >
                 <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
                 重置
               </Button>
                <Button
                  onClick={() => {
                    handleRecycleSearch();
                    setRecycleFilterOpen(false);
                  }}
                  className="rounded-full text-xs px-4 text-white"
                  style={{ backgroundColor: '#62bd7f' }}
                >
                  <Filter className="w-3.5 h-3.5" strokeWidth={1.8} />
                  筛选
                </Button>
             </div>
           </div>
          )}
          </div>

          {/* 操作栏 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {recycleBatchMode ? (
                <button
                  type="button"
                  onClick={toggleRecycleSelectAll}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {recycleAllSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary" strokeWidth={1.8} />
                  ) : (
                    <Square className="w-5 h-5" strokeWidth={1.8} />
                  )}
                  <span>全选</span>
                </button>
              ) : (
                <span className="text-sm text-muted-foreground tabular-nums">
                  共 {recycleTotal} 条记录
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {recycleBatchMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRecycleBatchMode(false);
                      setRecycleSelectedIds(new Set());
                    }}
                    className="rounded-full text-xs"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.8} />
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBatchRestore}
                    disabled={recycleSelectedIds.size === 0}
                    className="rounded-full text-xs text-white"
                    style={{ backgroundColor: '#438865' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
                    恢复({recycleSelectedIds.size})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={openBatchPermanentDelete}
                    disabled={recycleSelectedIds.size === 0}
                    className="rounded-full text-xs bg-destructive hover:bg-destructive/90"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                    删除({recycleSelectedIds.size})
                  </Button>
                </>
              ) : (
                 <>
                   <button
                     type="button"
                     onClick={() => setRecycleBatchMode(true)}
                     className="text-sm font-medium transition-colors hover:opacity-70"
                     style={{ color: '#2a483a' }}
                   >
                     批量选择
                   </button>
                 </>
               )}
            </div>
          </div>

          {/* 回收站记录列表 - 独立卡片 */}
          {loading && recycleRecords.length === 0 ? (
            <div className="paper-card p-10 text-center text-sm text-muted-foreground" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>加载中...</div>
          ) : recycleRecords.length === 0 ? (
            <div className="p-10"><EmptyState isRecycle /></div>
          ) : (
            <div className="space-y-4">
              {recycleRecords.map((record: RecycleRecord) => (
                <div
                  key={record.id}
                  className="bg-white overflow-hidden"
                  style={{
                    borderRadius: '20px',
                    boxShadow: '0 2px 12px rgba(39, 71, 55, 0.04)',
                  }}
                >
                  <RecycleItem
                    record={record}
                    batchMode={recycleBatchMode}
                    selected={recycleSelectedIds.has(record.id)}
                    onToggleSelect={toggleRecycleSelectOne}
                    onRestore={handleRestore}
                    onPermanentDelete={openPermanentDelete}
                  />
                </div>
              ))}
            </div>
          )}

          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* 导出弹窗 */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        defaultType={appliedType}
        defaultStartDate={appliedStart}
        defaultEndDate={appliedEnd}
      />

      {/* 记录详情弹窗 */}
      <RecordDetailDialog
        open={selectedDetailRecord !== null}
        record={selectedDetailRecord}
        onClose={() => setSelectedDetailRecord(null)}
      />

      {/* 永久删除确认弹窗 */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteConfirm({ open: false, type: '', id: '' });
        }}
      >
        <AlertDialogContent className="rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-medium">
              {deleteConfirm.id === '__batch__'
                ? `确认永久删除 ${recycleSelectedIds.size} 条记录？`
                : '确认永久删除？'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可恢复，该记录将被彻底删除，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       </div>
       </div>
     </div>
   );
 };
 
 export default DataPage;
