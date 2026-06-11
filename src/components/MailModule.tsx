import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, PanelLeft } from 'lucide-react';
import { useMailStore } from '../hooks/useMailStore';
import { useMailCompose } from '../hooks/useMailCompose';
import MailSidebar from './mail/MailSidebar';
import MailListView from './mail/MailListView';
import MailDetailView from './mail/MailDetailView';
import MailComposeDialog from './mail/MailComposeDialog';
import MailSnoozePopover from './mail/MailSnoozePopover';
import MailToast from './mail/MailToast';

interface MailModuleProps {
  lang: 'zh' | 'en';
}

export default function MailModule({ lang }: MailModuleProps) {
  const store = useMailStore(lang);
  const compose = useMailCompose({
    lang, emails: store.emails, saveEmails: store.saveEmails, showToast: store.showToast,
  });

  return (
    <div className="space-y-6 text-[#1A1A1A] font-sans">
      {/* Control strip — 模块身份由顶栏 logo 区承担，此处不再重复标题 */}
      <div className="bg-white border border-[#1A1A1A]/10 p-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button onClick={() => store.setIsSidebarCollapsed(!store.isSidebarCollapsed)}
            className={`p-1.5 border border-[#1A1A1A]/15 hover:bg-[#1A1A1A]/5 rounded-none transition-all flex items-center justify-center ${!store.isSidebarCollapsed ? 'bg-[#1A1A1A]/10 text-[#1A1A1A]' : 'bg-transparent text-[#1A1A1A]/70'}`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#1A1A1A]/40" />
            <input type="text"
              placeholder={lang === 'zh' ? '根据指令搜索信箱...' : 'Filter mailbox...'}
              value={store.searchText}
              onChange={e => store.setSearchText(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-8 py-1.5 text-xs border border-[#1A1A1A]/10 rounded-none bg-[#F9F8F6]/40 focus:bg-white focus:outline-none focus:border-[#1A1A1A] transition-colors"
            />
            <button onClick={() => store.setShowFilters(!store.showFilters)}
              className="absolute right-2 top-2 p-0.5 hover:bg-[#1A1A1A]/5 rounded-none text-neutral-500"
            >
              <Filter className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="hidden sm:flex gap-3 items-center px-3 py-1 border border-[#1A1A1A]/10 text-[9px] font-mono text-[#1A1A1A]/70 uppercase tracking-widest rounded-none">
            <div>{lang === 'zh' ? '未读:' : 'UNREAD:'} <strong className="text-amber-800 font-bold">{store.unreadInboxCount}</strong></div>
            <div className="w-[1px] h-3 bg-[#1A1A1A]/10" />
            <div>{lang === 'zh' ? '归档/推迟:' : 'ARCH/SNOOZE:'} <strong className="text-[#1A1A1A]">{store.emails.length}/{store.snoozedCount}</strong></div>
          </div>
          <button onClick={() => store.setIsSidebarCollapsed(!store.isSidebarCollapsed)}
            className="p-1 px-2.5 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 text-[9px] font-mono tracking-widest uppercase transition rounded-none"
          >
            {store.isSidebarCollapsed ? (lang === 'zh' ? '展开目录' : 'Expand Folders') : (lang === 'zh' ? '收缩目录' : 'Collapse')}
          </button>
          <button onClick={() => compose.setComposeState('window')}
            className="px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#2C2C2C] text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center gap-2 rounded-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '亲书信函' : 'Seal New Letter'}</span>
          </button>
        </div>
      </div>

      {/* Advanced filters form */}
      <AnimatePresence>
        {store.showFilters && (
          <div className="bg-white border border-[#1A1A1A] p-4 text-xs space-y-3 shadow-sm rounded-none">
            <div className="font-mono text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]/50 pb-2 border-b border-dashed border-[#1A1A1A]/10">
              {lang === 'zh' ? 'Hermes 自定义排字筛选器' : 'Hermes Advanced Metadata Filters'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: lang === 'zh' ? '寄件网关' : 'From Sender', value: store.filterFrom, onChange: store.setFilterFrom, placeholder: 'e.g. security' },
                { label: lang === 'zh' ? '收信地址' : 'To Recipient', value: store.filterTo, onChange: store.setFilterTo, placeholder: 'alexander@atelier.internal' },
                { label: lang === 'zh' ? '匹配标题' : 'Subject Matching', value: store.filterSubject, onChange: store.setFilterSubject, placeholder: 'e.g. quarterly report' },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label}>
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 mb-1">{label}</label>
                  <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    className="w-full text-xs p-1.5 bg-[#F9F8F6] border border-[#1A1A1A]/10 outline-none focus:border-[#1A1A1A] rounded-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={store.handleResetFilters} className="px-3 py-1 bg-transparent hover:bg-[#1A1A1A]/5 text-[9px] font-mono tracking-wider uppercase border border-[#1A1A1A]/10 text-neutral-600 rounded-none">
                {lang === 'zh' ? '恢复默认' : 'Reset'}
              </button>
              <button onClick={store.handleApplyAdvancedFilters} className="px-4 py-1 bg-[#1A1A1A] text-white hover:bg-[#2C2C2C] text-[9px] font-mono font-bold tracking-wider uppercase rounded-none">
                {lang === 'zh' ? '套用矩阵筛选' : 'Apply Matrix'}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex flex-col md:flex-row gap-5 items-stretch">
        <MailSidebar
          lang={lang} currentFolder={store.currentFolder}
          isSidebarCollapsed={store.isSidebarCollapsed}
          unreadInboxCount={store.unreadInboxCount} starredCount={store.starredCount}
          snoozedCount={store.snoozedCount} draftsCount={store.draftsCount}
          onSelectFolder={f => { store.setCurrentFolder(f); store.setSelectedEmail(null); }}
        />

        <div className="flex-grow flex-1 min-w-0 space-y-4">
          <AnimatePresence mode="wait">
            {!store.selectedEmail ? (
              <MailListView
                lang={lang} filteredList={store.filteredList}
                currentFolder={store.currentFolder} currentCategoryTab={store.currentCategoryTab}
                selectedIds={store.selectedIds} isSidebarCollapsed={store.isSidebarCollapsed}
                searchText={store.searchText}
                onSearchChange={store.setSearchText} onToggleFilters={() => store.setShowFilters(!store.showFilters)}
                onToggleSidebar={() => store.setIsSidebarCollapsed(!store.isSidebarCollapsed)}
                onCategoryTab={store.setCurrentCategoryTab}
                onRowClick={store.handleEmailRowClick}
                onToggleStar={store.handleToggleStar} onToggleImportant={store.handleToggleImportant}
                onArchive={store.handleArchiveEmail} onDelete={store.handleDeleteEmail}
                onSnooze={store.triggerSnoozePopover}
                onToggleSelectAll={store.handleToggleSelectAll}
                onSelectAllDropdown={store.handleSelectAllDropdown}
                onSelectId={id => store.setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }))}
                onBulkArchive={store.handleBulkArchive} onBulkDelete={store.handleBulkDelete}
                onBulkMarkRead={store.handleBulkMarkRead}
                onRefresh={() => store.showToast(lang === 'zh' ? '刷新系统信道，获取最新同步...' : 'Hermes cache synchronized')}
                getIsAllSelected={store.getIsAllSelected}
                onOpenCompose={() => compose.setComposeState('window')}
              />
            ) : (
              <MailDetailView
                lang={lang} email={store.selectedEmail}
                inlineReplyText={store.inlineReplyText}
                onReplyChange={store.setInlineReplyText}
                onSendReply={store.handleSendInlineReply}
                onBack={() => store.setSelectedEmail(null)}
                onArchive={store.handleArchiveEmail} onDelete={store.handleDeleteEmail}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating compose */}
      <AnimatePresence>
        {compose.composeState !== 'closed' && (
          <MailComposeDialog
            lang={lang} composeState={compose.composeState}
            composeTo={compose.composeTo} composeSubject={compose.composeSubject}
            composeBody={compose.composeBody} composeCategory={compose.composeCategory}
            showToSuggestions={compose.showToSuggestions} filteredSuggestions={compose.filteredSuggestions}
            onStateChange={compose.setComposeState}
            onToChange={compose.setComposeTo} onSubjectChange={compose.setComposeSubject}
            onBodyChange={compose.setComposeBody} onCategoryChange={compose.setComposeCategory}
            onToSuggestionsChange={compose.setShowToSuggestions}
            onSend={compose.handleSendComposeEmail} onShred={compose.handleShred}
          />
        )}
      </AnimatePresence>

      {/* Snooze popover */}
      <AnimatePresence>
        {store.showSnoozePopover && store.snoozePositions && (
          <MailSnoozePopover
            lang={lang} position={store.snoozePositions}
            onClose={() => store.setShowSnoozePopover(false)}
            onSnooze={store.executeSnooze}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {store.toastMessage && (
          <MailToast
            lang={lang} message={store.toastMessage}
            hasUndo={!!store.toastUndoAction}
            onUndo={store.handleUndo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
