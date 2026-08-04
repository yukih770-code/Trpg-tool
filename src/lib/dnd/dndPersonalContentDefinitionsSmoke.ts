import {
  deriveDndPersonalLibraryName,
  parseDndPersonalActionLines,
  parseDndPersonalChoiceLines,
  parseDndPersonalFeatureLines,
  parseDndPersonalNamedRuleLines,
  parseDndPersonalResourceLines,
} from './dndPersonalContentDefinitions';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const features = parseDndPersonalFeatureLines('1 | 潮汐步伐 | 在浅水中移动更自如\n5 | 海雾遮蔽 | 可在雾中隐藏踪迹');
assert(features.length === 2 && features[1]?.unlockLevel === 5, 'levelled features should retain their unlock levels');
assert(parseDndPersonalFeatureLines('港口人脉 | 可以向港口居民打听消息', 3)[0]?.unlockLevel === 3, 'feature lines without a level should use the section fallback');

const actions = parseDndPersonalNamedRuleLines('短剑 | 近战武器攻击\n警戒 | 敌人靠近时可以作出反应');
assert(actions.length === 2 && actions[0]?.name === '短剑', 'named rules should retain name and description');
assert(parseDndPersonalResourceLines('魂丝 | 职业等级 + 魅力调整值 + 熟练加值 | 长休；短休一次 | 强化职业能力')[0]?.maximum.includes('职业等级'), 'resources should preserve authored formulas');
assert(parseDndPersonalActionLines('魂击 | 附赠动作命令 | 5 尺 | 1 魂丝 | 魂器进行一次攻击')[0]?.activation === '附赠动作命令', 'actions should retain activation facts');
assert(parseDndPersonalChoiceLines('魂艺 | 2 级 | 选择两项 | 空壳之眼；灵魂换位')[0]?.options.length === 2, 'choice groups should retain their bounded options');
assert(deriveDndPersonalLibraryName([{ displayName: '潮汐精灵' }]) === '潮汐精灵', 'single entries should not expose a pack title');
assert(deriveDndPersonalLibraryName([{ displayName: '潮汐精灵' }, { displayName: '港湾守卫' }]).includes('2 项'), 'multi-entry drafts should receive a derived internal title');

console.log('dnd-personal-content-definitions smoke: ok');
