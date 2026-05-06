import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Card, CardContent } from '../../components/ui/card';
import { useCharacterStore } from '../store/characterStore';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from '../../components/ui/scroll-area';
import { evaluateModCompatibility } from '../lib/modManager';

export const OFFICIAL_MODS = [
  { name: '玩家手册 2024 (基础规则已集成)', system: 'D&D' },
  { name: '城主指南 2024', system: 'D&D' },
  { name: '怪物图鉴 2025', system: 'D&D' },
  { name: '珊娜萨的万事指南', system: 'D&D' },
  { name: '塔莎的万事坩埚', system: 'D&D' },
  { name: '魔邓肯巨献：多元宇宙的怪物', system: 'D&D' },
  { name: '费资本的巨龙宝库', system: 'D&D' },
  { name: '毕格比巨献：巨人之荣耀', system: 'D&D' },
  { name: '万象无常书', system: 'D&D' },
  { name: '剑湾冒险者指南', system: 'D&D' },
  { name: '艾伯伦寻路者指南', system: 'D&D' },
  { name: '拉尼卡公会长指南', system: 'D&D' },
  { name: '范·里希腾的鸦阁魔域指南', system: 'D&D' },
  { name: '斯翠海文：混沌研习', system: 'D&D' },
  { name: '星界冒险者指南', system: 'D&D' },
  { name: '克苏鲁的呼唤 7版核心规则 (CoC)', system: 'CoC' },
  { name: '调查员手册 7版', system: 'CoC' }
];

export function ModManager() {
  const [open, setOpen] = useState(false);
  const { character, toggleMod, addCustomMod, removeCustomMod, setMods } = useCharacterStore();
  const { activeMods = [], customModsData = [] } = character;

  const handleToggleMod = (modName: string) => {
    if (activeMods.includes(modName)) {
      toggleMod(modName);
      return;
    }

    const { isValid, conflicts, systemChanges, targetSystem } = evaluateModCompatibility(activeMods, customModsData, modName);

    if (systemChanges && targetSystem) {
       // Disable all mods not from target system
       const newlyActive = [modName]; // The user toggled this one explicitly

       // Check official mods compatibility
       for (const m of activeMods) {
         const isOfficial = OFFICIAL_MODS.find(o => o.name === m);
         const isCustom = customModsData.find(c => c.name === m);
         const sys = isOfficial?.system || isCustom?.baseSystem || 'D&D';
         if (sys === targetSystem) {
           newlyActive.push(m);
         }
       }
       
       setMods(newlyActive);
       toast.warning(`已切换系统核心至 ${targetSystem}`, {
         description: '所有与当前系统不兼容的模组已被自动关闭。'
       });
       return;
    }

    if (!isValid) {
      toast.error('发现模组冲突，拒绝启用。', {
        description: conflicts.map(c => c.reason).join(' | ')
      });
      return;
    }

    toggleMod(modName);
  };

  const handleImportMod = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const mod = JSON.parse(event.target?.result as string);
          if (!mod.name) {
            toast.error("无效的 Mod 文件: 未找到名称");
            return;
          }
          const finalMod = {
            id: mod.id || crypto.randomUUID?.() || Date.now().toString(),
            name: mod.name,
            ...mod
          };
          addCustomMod(finalMod);
          toast.success(`成功导入 Mod: ${mod.name}`);
        } catch (e) {
          toast.error("解析 Mod 文件失败");
        }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleRemoveMod = (modId: string) => {
    removeCustomMod(modId);
    toast.info("已移除自定义 Mod");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" size="sm" className="border-[#58180d] text-[#58180d] hover:bg-[#58180d] hover:text-white uppercase font-bold transition-colors rounded-none" />
        }
      >
        💡 规则与 Mod 管理
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col bg-[#fdf6e3] border-2 border-[#58180d] text-[#2c1810] font-serif rounded-none shadow-[4px_4px_0px_#58180d]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-[#58180d]">扩展规则与社区 Mod</DialogTitle>
          <DialogDescription className="text-[#58180d]/80 text-sm italic">
            本模拟器默认采用 D&D 2024 规则。你可以在此开启额外扩展书或导入自定义 JSON 模组。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto -mx-4 px-4 py-4 custom-scrollbar">
          <div className="grid gap-8">
            
            <div className="flex flex-col gap-3">
              <h3 className="uppercase text-lg tracking-widest text-[#a68a56] font-bold border-b-2 border-[#58180d]/30 pb-2">一、可用规则书</h3>
              
              <div className="flex flex-wrap gap-2">
                {OFFICIAL_MODS.map(mod => {
                  const modName = mod.name;
                  const isActive = activeMods.includes(modName);
                  const isBase = modName.includes('基础规则已集成');
                  return (
                    <button
                      key={modName}
                      disabled={isBase}
                      onClick={() => !isBase && handleToggleMod(modName)}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors border ${
                        isBase
                          ? 'bg-[#58180d]/20 text-[#58180d]/50 border-[#58180d]/20 cursor-default'
                          : isActive 
                            ? 'bg-[#58180d] text-white border-[#58180d] hover:bg-[#2c1810]' 
                            : 'bg-transparent text-[#58180d] border-[#58180d] hover:bg-[#58180d]/10'
                      }`}
                    >
                      {isBase ? '🔒 ' : isActive ? '✓ ' : ''}{modName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t-2 border-[#58180d]/30">
              <h3 className="uppercase text-lg tracking-widest text-[#a68a56] font-bold border-b-2 border-[#58180d]/30 pb-2">二、自定义 Mod 导入</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-[#ede1c5]/30 border border-[#58180d]/30 shadow-none rounded-none text-sm">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#58180d]">📄 导入说明</h4>
                      <p className="text-xs leading-relaxed opacity-80">
                        你可以通过导入特定的 JSON 文件来增加自定义的种族、职业、法术或专长。导入的文件将被永久保存在你的本地浏览器环境。
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#58180d]">🛠 JSON 结构示例</h4>
                      <pre className="text-[10px] bg-black/5 p-2 overflow-x-auto font-mono">
{`{
  "name": "我的自定义扩展",
  "spells": [
    { "name_cn": "奥术核爆", "level": 9, ... }
  ],
  "feats": [
    { "name": "屠龙高手", "desc": "..." }
  ]
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input type="file" onChange={handleImportMod} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" accept=".json,.zip" />
                    <Button variant="default" className="w-full bg-[#58180d] hover:bg-[#2c1810] text-[#fdf6e3] uppercase font-bold rounded-none h-12">
                      + 选择本地文件导入
                    </Button>
                  </div>
                  <p className="text-[10px] text-center text-[#58180d]/60 italic">支持 .json 格式文件</p>

                  {customModsData.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 bg-white/40 border border-[#58180d]/30 p-2">
                      <p className="text-[10px] font-bold uppercase text-[#a68a56]">当前活跃的自定义 Mod</p>
                      {customModsData.map(mod => (
                        <div key={mod.id} className="flex justify-between items-center p-2 border-b border-[#58180d]/10 hover:bg-[#58180d]/5">
                          <span className="font-bold text-xs text-[#2c1810] truncate max-w-[150px]">{mod.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveMod(mod.id)}
                            className="text-red-700 hover:text-red-900 hover:bg-red-100 rounded-none h-6 px-2 text-[10px]"
                          >
                            移除
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
