import React, { useState } from 'react';
import { Creator } from './pages/Creator';
import { Sheet } from './pages/Sheet';
import { Gameplay } from './pages/Gameplay';
import { Toaster } from '../components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useCharacterStore } from './store/characterStore';
import { useAppStore } from './store/appStore';
import { Save, Upload, Shuffle } from 'lucide-react';
import { Button } from '../components/ui/button';

import { ModManager } from './components/ModManager';

import { CocCreator } from './pages/CocCreator';
import { CocSheet } from './pages/CocSheet';
import { CocGameplay } from './pages/CocGameplay';
import { useCocStore } from './store/cocStore';

export default function App() {
  const [tab, setTab] = useState('creator');
  const { system, setSystem } = useAppStore();

  const isCoC = system === 'CoC';
  const { character: dndChar, loadCharacter: loadDndChar } = useCharacterStore();
  const { character: cocChar, loadCharacter: loadCocChar } = useCocStore();

  const activeCharacter = isCoC ? cocChar : dndChar;

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeCharacter, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${system.toLowerCase()}-char-${activeCharacter.name || 'unnamed'}.json`);
    dlAnchorElem.click();
    toast.success("存档已成功导出到本地文件");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (isCoC) {
            if (parsed && parsed.characteristics) {
              loadCocChar(parsed);
              toast.success("这名调查员的笔记已被寻回。");
            } else {
              toast.error('无效的 CoC 调查员文件');
            }
          } else {
            if (parsed && parsed.attrs) {
              loadDndChar(parsed);
              toast.success("冒险者的档案已被加载。");
            } else {
              toast.error('无效的 D&D 角色卡文件');
            }
          }
        } catch (error) {
          toast.error('解析失败，请检查文件');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
    // reset input
    e.target.value = '';
  };

  // D&D Theme Colors
  const dndBg = "bg-[#fdf6e3]";
  const dndText = "text-[#2c1810]";
  const dndSelect = "selection:bg-[#58180d] selection:text-white";
  const dndBorder = "border-[#58180d]";
  const dndPrimaryBg = "bg-[#58180d]";
  const dndPrimaryText = "text-[#58180d]";
  
  // CoC Theme Colors
  const cocBg = "bg-[#1a1a1a]";
  const cocText = "text-[#d4d4d8]";
  const cocSelect = "selection:bg-[#059669] selection:text-white";
  const cocBorder = "border-[#059669]";
  const cocPrimaryBg = "bg-[#059669]";
  const cocPrimaryText = "text-[#059669]";

  return (
    <div className={`min-h-screen font-serif p-4 md:p-8 transition-colors duration-500
      ${isCoC ? `${cocBg} ${cocText} ${cocSelect}` : `${dndBg} ${dndText} ${dndSelect}`}`}>
      <div className="max-w-6xl mx-auto">
        <div className={`flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-2 pb-4 gap-4 ${isCoC ? cocBorder : dndBorder}`}>
          <h1 className={`text-4xl font-bold uppercase tracking-tighter ${isCoC ? cocPrimaryText : dndPrimaryText}`}>
            {isCoC ? '克苏鲁的呼唤 调查员笔记' : 'D&D 2024 冒险者指南'}
          </h1>
          <div className="flex gap-2 flex-wrap items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSystem(isCoC ? 'D&D' : 'CoC')}
              className={`uppercase font-bold transition-colors rounded-none border-2
                ${isCoC ? 'border-[#059669] text-[#059669] hover:bg-[#059669] hover:text-[#1a1a1a]' 
                        : 'border-[#58180d] text-[#58180d] hover:bg-[#58180d] hover:text-[#fdf6e3]'}`}
            >
              <Shuffle className="w-4 h-4 mr-2" /> 
              切换至 {isCoC ? 'D&D' : 'CoC'}
            </Button>

            <ModManager />
            <Button variant="outline" size="sm" onClick={handleExport} className={`uppercase font-bold transition-colors rounded-none ${isCoC ? 'border-[#059669] text-[#059669]' : 'border-[#58180d] text-[#58180d]'}`}>
              <Save className="w-4 h-4 mr-2" /> 导出角色
            </Button>
            <div className="relative">
              <input type="file" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" accept=".json" />
              <Button variant="outline" size="sm" className={`uppercase font-bold transition-colors rounded-none ${isCoC ? 'border-[#059669] text-[#059669]' : 'border-[#58180d] text-[#58180d]'}`}>
                <Upload className="w-4 h-4 mr-2" /> 导入角色
              </Button>
            </div>
          </div>
        </div>

        {/* ... Rest of tabs and components ... */}
        
        {isCoC ? (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#111] p-1 border border-[#059669] rounded-none gap-1">
              <TabsTrigger value="creator" className="data-[state=active]:bg-[#059669] data-[state=active]:text-[#111] text-[#059669] font-bold uppercase rounded-none transition-colors">建卡 (Creation)</TabsTrigger>
              <TabsTrigger value="sheet" className="data-[state=active]:bg-[#059669] data-[state=active]:text-[#111] text-[#059669] font-bold uppercase rounded-none transition-colors">调查员卡 (Sheet)</TabsTrigger>
              <TabsTrigger value="gameplay" className="data-[state=active]:bg-[#059669] data-[state=active]:text-[#111] text-[#059669] font-bold uppercase rounded-none transition-colors">掷骰 & 日志 (Gameplay)</TabsTrigger>
            </TabsList>
            
            <div className="bg-[#111]/80 border-2 border-[#059669] p-6 min-h-[70vh]">
              <TabsContent value="creator">
                <CocCreator onComplete={() => setTab('sheet')} />
              </TabsContent>
              <TabsContent value="sheet">
                <CocSheet />
              </TabsContent>
              <TabsContent value="gameplay">
                <CocGameplay />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#ede1c5] p-1 border border-[#58180d] rounded-none gap-1">
              <TabsTrigger value="creator" className="data-[state=active]:bg-[#58180d] data-[state=active]:text-white text-[#58180d] font-bold uppercase rounded-none transition-colors">创建器</TabsTrigger>
              <TabsTrigger value="sheet" className="data-[state=active]:bg-[#58180d] data-[state=active]:text-white text-[#58180d] font-bold uppercase rounded-none transition-colors">角色卡</TabsTrigger>
              <TabsTrigger value="gameplay" className="data-[state=active]:bg-[#58180d] data-[state=active]:text-white text-[#58180d] font-bold uppercase rounded-none transition-colors">游玩 / 战斗</TabsTrigger>
            </TabsList>
            
            <div className="bg-white/50 border-2 border-[#58180d] p-6 min-h-[70vh]">
              <TabsContent value="creator">
                <Creator onComplete={() => setTab('sheet')} />
              </TabsContent>
              <TabsContent value="sheet">
                <Sheet />
              </TabsContent>
              <TabsContent value="gameplay">
                <Gameplay />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
      <Toaster />
    </div>
  );
}
