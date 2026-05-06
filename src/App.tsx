import React, { useState } from 'react';
import { Creator } from './pages/Creator';
import { Sheet } from './pages/Sheet';
import { Gameplay } from './pages/Gameplay';
import { Toaster } from '../components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useCharacterStore } from './store/characterStore';
import { Save, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';

import { ModManager } from './components/ModManager';

export default function App() {
  const [tab, setTab] = useState('creator');
  const { character, loadCharacter } = useCharacterStore();

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(character, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `dnd-char-${character.name || 'unnamed'}.json`);
    dlAnchorElem.click();
    toast.success("存档已成功导出到本地文件");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.attrs) {
            loadCharacter(parsed);
          } else {
            alert('无效的角色卡文件');
          }
        } catch (error) {
          alert('解析失败，请检查文件');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6e3] text-[#2c1810] font-serif p-4 md:p-8 selection:bg-[#58180d] selection:text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-2 border-[#58180d] pb-4 gap-4">
          <h1 className="text-4xl font-bold text-[#58180d] uppercase tracking-tighter">D&D 5E 角色管家</h1>
          <div className="flex gap-2 flex-wrap">
            <ModManager />
            <Button variant="outline" size="sm" onClick={handleExport} className="border-[#58180d] text-[#58180d] hover:bg-[#58180d] hover:text-white uppercase font-bold transition-colors rounded-none">
              <Save className="w-4 h-4 mr-2" /> 导出角色
            </Button>
            <div className="relative">
              <input type="file" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" accept=".json" />
              <Button variant="outline" size="sm" className="border-[#58180d] text-[#58180d] hover:bg-[#58180d] hover:text-white uppercase font-bold transition-colors rounded-none">
                <Upload className="w-4 h-4 mr-2" /> 导入角色
              </Button>
            </div>
          </div>
        </div>

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
      </div>
      <Toaster />
    </div>
  );
}
