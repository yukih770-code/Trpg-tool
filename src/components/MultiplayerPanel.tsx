import React, { useState, useEffect } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { networkManager, GameMessage } from '../lib/network';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Users, Link, Copy, Check, Radio } from 'lucide-react';

export function MultiplayerPanel() {
  const { character } = useCharacterStore();
  const [peerId, setPeerId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [isHosting, setIsHosting] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const [peerState, setPeerState] = useState<Record<string, any>>({});

  useEffect(() => {
    networkManager.onMessage((msg: GameMessage) => {
      if (msg.type === 'DICE_ROLL') {
        toast(`${msg.sender} 掷骰结果: ${msg.payload.result} (${msg.payload.reason})`);
      } else if (msg.type === 'SYNC_STATE') {
        setPeerState(prev => ({ ...prev, [msg.sender]: msg.payload }));
        toast.info(`${msg.sender} 同步了他们的角色卡`);
      }
      setConnectedPeers(networkManager.getConnectedPeers());
    });
    
    // Interval to refresh peer list
    const timer = setInterval(() => {
      setConnectedPeers(networkManager.getConnectedPeers());
    }, 3000);

    return () => {
      clearInterval(timer);
      networkManager.disconnect();
    };
  }, []);

  const handleStartHosting = async () => {
    try {
      const id = await networkManager.init(character.name || `User_${Math.floor(Math.random()*1000)}`);
      setPeerId(id);
      setIsHosting(true);
      toast.success('联机服务已启动');
    } catch (err) {
      toast.error('启动失败，可能名称被占用或控制台报错');
    }
  };

  const handleConnect = () => {
    if (!targetId) return;
    if (!isHosting) {
      handleStartHosting().then(() => {
        networkManager.connect(targetId);
      });
    } else {
      networkManager.connect(targetId);
    }
    setTargetId('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.info('名称已复制，发给好友加入吧');
  };

  const handleSyncSelf = () => {
    if (!isHosting) return;
    networkManager.broadcast({
      type: 'SYNC_STATE',
      sender: character.name || peerId,
      payload: character
    });
    toast.success('已广播你的角色卡数据');
  };

  return (
    <Card className="bg-[#fdf6e3] border-2 border-[#58180d] rounded-none shadow-[2px_2px_0px_#58180d] mb-4 overflow-hidden">
      <div className="bg-[#58180d] text-white p-2 flex items-center gap-2">
        <Users size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">联机大厅 (WebRTC 直连)</span>
        {isHosting && (
          <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/50 text-[10px] animate-pulse">
            <Radio size={10} className="mr-1" /> 在线
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3 space-y-3 font-serif">
        {!isHosting ? (
          <div className="space-y-2">
            <p className="text-[10px] text-[#58180d]/70 italic leading-tight">
              * 使用国内腾讯/小米 STUN 节点优化，确保中国地区网络直接穿透。
            </p>
            <Button 
              onClick={handleStartHosting}
              className="w-full bg-[#58180d] hover:bg-[#2c1810] text-[#fdf6e3] h-8 rounded-none text-xs font-bold"
            >
              启动我的联机身份
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#a68a56]">我的房间 ID (发给好友)</label>
              <div className="flex gap-1">
                <div className="flex-1 bg-white border border-[#58180d]/30 px-2 py-1 text-xs font-bold text-[#58180d] truncate">
                  {peerId}
                </div>
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-7 w-7 border-[#58180d] text-[#58180d] rounded-none p-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#a68a56]">加入好友房间</label>
              <div className="flex gap-1">
                <Input 
                  placeholder="输入好友的 ID" 
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="h-7 text-xs border-[#58180d]/30 rounded-none bg-white font-sans"
                />
                <Button onClick={handleConnect} className="h-7 px-3 bg-[#58180d] text-[#fdf6e3] rounded-none text-xs">
                  连接
                </Button>
              </div>
            </div>

            {connectedPeers.length > 0 && (
              <div className="pt-2 border-t border-[#58180d]/20">
                <p className="text-[10px] font-bold text-[#58180d] mb-1">当前连接中的伙伴 ({connectedPeers.length}):</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {connectedPeers.map(id => (
                    <Badge key={id} variant="outline" className="bg-white border-[#58180d]/30 text-[#58180d] text-[9px] rounded-none font-sans">
                      {id}
                    </Badge>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSyncSelf}
                  className="w-full text-[10px] h-6 rounded-none bg-neutral-200 text-black border border-[#58180d]/30 hover:bg-white"
                >
                  广播我的角色卡给全场同步
                </Button>
                
                {Object.keys(peerState).length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] font-bold text-[#58180d]">收到的卡片摘要:</p>
                    {Object.entries(peerState).map(([name, data]: [string, any]) => (
                      <div key={name} className="text-[9px] bg-white p-1 border border-[#58180d]/20 font-sans leading-tight">
                        <span className="font-bold text-[#58180d]">{name}</span>: {data.race} {data.jobClass} L{data.level} (HP: {data.hpCurrent}/{data.hpMax})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
