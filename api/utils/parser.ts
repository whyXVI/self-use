const SupportedProtocols = {
  HTTPS : 'https://',
}

export function paramsToUrls(
  json: Record<string, unknown>
): { success: true; urls: string[] } | { success: false; error: string } {
  
  if (!('urls' in json)) {
    return { success: true, urls: [] };
  }
  
  const urlsField = json.urls;
  
  if (typeof urlsField !== 'object' || urlsField === null) {
    return { success: false, error: 'urls field must be an object or array' };
  }
  
  try {
    const extractedUrls: string[] = [];
    const values = Array.isArray(urlsField) ? urlsField : Object.values(urlsField);
    
    values.forEach(value => {
        if (typeof value === 'string' && 
            Object.values(SupportedProtocols).some(protocol => value.startsWith(protocol))) {
            extractedUrls.push(value);
        }
    });
    
    return { success: true, urls: extractedUrls };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to extract URLs: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

import { load } from 'js-yaml';

interface ClashMetaSSNode {
  name: string;
  server: string;
  port: number;
  type: string;
  cipher: string;
  password: string;
}

// clash-meta shadowsocks2
export function extractClashmetaNodes(texts: string[]): ClashMetaSSNode[] {
  return texts
    .map(text => {
      const config = load(text) as any;
      return config?.proxies?.map((proxy: any) => ({
        name: proxy.name,
        server: proxy.server,
        port: proxy.port,
        type: proxy.type,
        cipher: proxy.cipher,
        password: proxy.password
      })) || [];
    })
    .flat();
}

interface SingboxOutboundSS {
  tag: string;
  type: "shadowsocks";
  server: string;
  server_port: number;
  method: string;
  password: string;
  domain_resolver?: string;
  tcp_fast_open?: boolean;
}

export function clashmetaSSToSingbox(
  nodes: ClashMetaSSNode[], domain_resolver: string = "dns_local"
): SingboxOutboundSS[] {
  return nodes.map(node => ({
    tag: node.name,
    type: "shadowsocks",
    server: node.server,
    server_port: node.port,
    method: node.cipher,
    password: node.password,
    domain_resolver: domain_resolver,
    tcp_fast_open: true
  }));
}


interface RegionSelectorOutbound {
  tag: string;
  outbounds: string[];
  type: "selector";
}

const regexPatterns: Record<string, RegExp> = {
    '🇭🇰': /香港|沪港|呼港|中港|HKT|HKBN|HGC|WTT|CMI|穗港|广港|京港|🇭🇰|HK|Hongkong|Hong Kong|HongKong|HONG KONG/,
    '🇹🇼': /台湾|台灣|臺灣|台北|台中|新北|彰化|台|CHT|HINET|TW|Taiwan|TAIWAN/,
    '🇸🇬': /新加坡|狮城|獅城|沪新|京新|泉新|穗新|深新|杭新|广新|廣新|滬新|SG|Singapore|SINGAPORE/,
    '🇯🇵': /日本|东京|東京|大阪|埼玉|京日|苏日|沪日|广日|上日|穗日|川日|中日|泉日|杭日|深日|JP|Japan|JAPAN/,
    '🇺🇸': /美国|美國|京美|硅谷|凤凰城|洛杉矶|西雅图|圣何塞|芝加哥|哥伦布|纽约|广美|(\s|-)?(?<![AR])US\d*|USA|America|United States/,
    '🇰🇷': /韩国|韓國|首尔|首爾|韩|韓|春川|KOR|KR|Kr|(?<!North\s)Korea/,
    '🇰🇵': /朝鲜|KP|North Korea/,
    '🇷🇺': /俄罗斯|俄羅斯|毛子|俄国|RU|RUS|Russia/,
    '🇮🇳': /印度|孟买|(\s|-)?IN(?!FO)\d*|IND|India|INDIA|Mumbai/,
    '🇮🇩': /印尼|印度尼西亚|雅加达|ID|IDN|Indonesia/,
    '🇬🇧': /英国|英國|伦敦|UK|England|United Kingdom|Britain/,
    '🇩🇪': /德国|德國|法兰克福|(\s|-)?DE\d*|(\s|-)?GER\d*|🇩🇪|German|GERMAN/,
    '🇫🇷': /法国|法國|巴黎|FR(?!EE)|France/,
    '🇩🇰': /丹麦|丹麥|DK|DNK|Denmark/,
    '🇳🇴': /挪威|(\s|-)?NO\d*|Norway/,
    '🇮🇹': /意大利|義大利|米兰|(\s|-)?IT\d*|Italy|Nachash/,
    '🇻🇦': /梵蒂冈|梵蒂岡|(\s|-)?VA\d*|Vatican City/,
    '🇧🇪': /比利时|比利時|(\s|-)?BE\d*|Belgium/,
    '🇦🇺': /澳大利亚|澳洲|墨尔本|悉尼|(\s|-)?AU\d*|Australia|Sydney/,
    '🇨🇦': /加拿大|蒙特利尔|温哥华|多伦多|多倫多|滑铁卢|楓葉|枫叶|CA|CAN|Waterloo|Canada|CANADA/,
    '🇲🇾': /马来西亚|马来|馬來|MY|Malaysia|MALAYSIA/,
    '🇹🇷': /土耳其|伊斯坦布尔|(\s|-)?TR\d|TR_|TUR|Turkey/,
    '🇵🇭': /菲律宾|菲律賓|(\s|-)?PH\d*|Philippines/,
    '🇹🇭': /泰国|泰國|曼谷|(\s|-)?TH\d*|Thailand/,
    '🇻🇳': /越南|胡志明市|(\s|-)?VN\d*|Vietnam/,
    '🇺🇦': /乌克兰|烏克蘭|(\s|-)?UA\d*|Ukraine/,
    '🇭🇺': /匈牙利|(\s|-)?HU\d*|Hungary/,
    '🇨🇭': /瑞士|苏黎世|(\s|-)?CH\d*|Switzerland/,
    '🇸🇪': /瑞典|SE|Sweden/,
    '🇱🇺': /卢森堡|(\s|-)?LU\d*|Luxembourg/,
    '🇦🇹': /奥地利|奧地利|维也纳|(\s|-)?AT\d*|Austria/,
    '🇨🇿': /捷克|(\s|-)?CZ\d*|Czechia/,
    '🇬🇷': /希腊|希臘|(\s|-)?GR(?!PC)\d*|Greece/,
    '🇮🇸': /冰岛|冰島|(\s|-)?IS\d*|ISL|Iceland/,
    '🇳🇿': /新西兰|新西蘭|(\s|-)?NZ\d*|New Zealand/,
    '🇮🇪': /爱尔兰|愛爾蘭|都柏林|(\s|-)?IE(?!PL)\d*|Ireland|IRELAND/,
    '🇮🇲': /马恩岛|馬恩島|(\s|-)?IM\d*|Mannin|Isle of Man/,
    '🇱🇹': /立陶宛|(\s|-)?LT\d*|Lithuania/,
    '🇫🇮': /芬兰|芬蘭|赫尔辛基|(\s|-)?FI\d*|Finland/,
    '🇺🇾': /乌拉圭|烏拉圭|(\s|-)?UY\d*|Uruguay/,
    '🇵🇾': /巴拉圭|(\s|-)?PY\d*|Paraguay/,
    '🇯🇲': /牙买加|牙買加|(\s|-)?JM(?!S)\d*|Jamaica/,
    '🇪🇸': /西班牙|\b(\s|-)?ES\d*|Spain/,
    '🇵🇹': /葡萄牙|Portugal/,
    '🇮🇱': /以色列|(\s|-)?IL\d*|Israel/,
    '🇸🇦': /沙特|利雅得|吉达|Saudi|Saudi Arabia/,
    '🇲🇳': /蒙古|(\s|-)?MN\d*|Mongolia/,
    '🇦🇪': /阿联酋|迪拜|(\s|-)?AE\d*|Dubai|United Arab Emirates/,
    '🇦🇿': /阿塞拜疆|(\s|-)?AZ\d*|Azerbaijan/,
    '🇦🇲': /亚美尼亚|亞美尼亞|(\s|-)?AM\d*|Armenia/,
    '🇰🇿': /哈萨克斯坦|哈薩克斯坦|(\s|-)?KZ\d*|Kazakhstan/,
    '🇰🇬': /吉尔吉斯坦|吉尔吉斯斯坦|(\s|-)?KG\d*|Kyrghyzstan/,
    '🇺🇿': /乌兹别克斯坦|烏茲別克斯坦|(\s|-)?UZ\d*|Uzbekistan/,
    '🇧🇷': /巴西|圣保罗|维涅杜|(?<!G)BR|Brazil/,
    '🇨🇱': /智利|(\s|-)?CL\d*|Chile|CHILE/,
    '🇵🇪': /秘鲁|祕魯|(\s|-)?PE\d*|Peru/,
    '🇨🇺': /古巴|Cuba/,
    '🇯🇴': /约旦|約旦|(\s|-)?JO\d*|Jordan/,
    '🇬🇪': /格鲁吉亚|格魯吉亞|(\s|-)?GE(?!R)\d*|Georgia/,
    '🇸🇲': /圣马力诺|聖馬利諾|(\s|-)?SM\d*|San Marino/,
    '🇳🇵': /尼泊尔|(\s|-)?NP\d*|Nepal/,
    '🇦🇽': /奥兰群岛|奧蘭群島|(\s|-)?AX\d*|Åland/,
    '🇸🇮': /斯洛文尼亚|斯洛文尼亞|(\s|-)?SI\d*|Slovenia/,
    '🇦🇱': /阿尔巴尼亚|阿爾巴尼亞|(\s|-)?AL\d*|Albania/,
    '🇹🇱': /东帝汶|東帝汶|(\s|-)?TL(?!S)\d*|East Timor/,
    '🇵🇦': /巴拿马|巴拿馬|(\s|-)?PA\d*|Panama/,
    '🇧🇲': /百慕大|(\s|-)?BM\d*|Bermuda/,
    '🇷🇪': /留尼汪|留尼旺|(\s|-)?RE(?!LAY)\d*|Réunion|Reunion/,
    '🇿🇦': /南非|约翰内斯堡|(\s|-)?ZA\d*|South Africa|Johannesburg/,
    '🇪🇬': /埃及|(\s|-)?EG\d*|Egypt/,
    '🇬🇭': /加纳|(\s|-)?GH\d*|Ghana/,
    '🇲🇱': /马里|馬里|(\s|-)?ML\d*|Mali/,
    '🇲🇦': /摩洛哥|(\s|-)?MA\d*|Morocco/,
    '🇹🇳': /突尼斯|(\s|-)?TN\d*|Tunisia/,
    '🇱🇾': /利比亚|(\s|-)?LY\d*|Libya/,
    '🇰🇪': /肯尼亚|肯尼亞|(\s|-)?KE\d*|Kenya/,
    '🇷🇼': /卢旺达|盧旺達|(\s|-)?RW\d*|Rwanda/,
    '🇨🇻': /佛得角|維德角|(\s|-)?CV\d*|Cape Verde/,
    '🇦🇴': /安哥拉|(\s|-)?AO\d*|Angola/,
    '🇳🇬': /尼日利亚|尼日利亞|拉各斯|(\s|-)?NG\d*|Nigeria/,
    '🇲🇺': /毛里求斯|(\s|-)?MU\d*|Mauritius/,
    '🇴🇲': /阿曼|(\s|-)?OM\d*|Oman/,
    '🇧🇭': /巴林|(\s|-)?BH\d*|Bahrain/,
    '🇮🇶': /伊拉克|(\s|-)?IQ\d*|Iraq/,
    '🇮🇷': /伊朗|(\s|-)?IR\d*|Iran/,
    '🇦🇫': /阿富汗|(\s|-)?AF\d*|Afghanistan/,
    '🇵🇰': /巴基斯坦|(\s|-)?PK\d*|Pakistan|PAKISTAN/,
    '🇶🇦': /卡塔尔|卡塔爾|(\s|-)?QA\d*|Qatar/,
    '🇸🇾': /叙利亚|敘利亞|(\s|-)?SY\d*|Syria/,
    '🇱🇰': /斯里兰卡|斯里蘭卡|(\s|-)?LK\d*|Sri Lanka/,
    '🇻🇪': /委内瑞拉|(\s|-)?VE\d*|Venezuela/,
    '🇬🇹': /危地马拉|(\s|-)?GT\d*|Guatemala/,
    '🇵🇷': /波多黎各|(\s|-)?PR\d*|Puerto Rico/,
    '🇰🇾': /开曼群岛|開曼群島|盖曼群岛|凯门群岛|(\s|-)?KY\d*|Cayman Islands/,
    '🇸🇯': /斯瓦尔巴|扬马延|(\s|-)?SJ\d*|Svalbard|Mayen/,
    '🇭🇳': /洪都拉斯|Honduras/,
    '🇳🇮': /尼加拉瓜|(\s|-)?NI\d*|Nicaragua/,
    '🇦🇶': /南极|南極|(\s|-)?AQ\d*|Antarctica/,
    '🇨🇳': /中国|中國|江苏|北京|上海|广州|深圳|杭州|徐州|青岛|宁波|镇江|沈阳|济南|回国|back|(\s|-)?CN(?!2GIA)\d*|China/,
};

function generateRegionOutbounds(
  allNodes: { tag: string; [key: string]: any }[], 
  regionsToGenerate: string[]= ["🇭🇰", "🇺🇸", "🇯🇵"]
): RegionSelectorOutbound[] | void {
  
  if (!allNodes || allNodes.length === 0) {
    return;
  }
  
  // Classify nodes by region
  const regionGroups: Record<string, string[]> = {};
  
  for (const node of allNodes) {
    if (!node.tag) continue;
    
    // Find matching region for this node
    for (const [region, pattern] of Object.entries(regexPatterns)) {
      if (pattern.test(node.tag)) {
        if (!regionGroups[region]) {
          regionGroups[region] = [];
        }
        regionGroups[region].push(node.tag);
        break; // Stop at first match to avoid duplicates
      }
    }
  }
  
  // Generate selectors for regions with nodes
  const regionOutbounds: RegionSelectorOutbound[] = [];
  
  for (const [region, tags] of Object.entries(regionGroups)) {
    // Filter by regionsToGenerate if specified
    if (regionsToGenerate && !regionsToGenerate.includes(region)) {
      continue;
    }
    
    regionOutbounds.push({
      tag: `${region} Region`,
      type: "selector",
      outbounds: tags
    });
  }
  
  return regionOutbounds.length > 0 ? regionOutbounds : undefined;
}

import { readFileSync } from 'fs';
import { join } from 'path';

export function addOutboundsToTemplate(newOutbounds: any[]): any {
  // Vercel serverless function
  const templatePath = join(process.cwd(), 'api', 'utils', 'templates', 'singbox-1-12.json');
  
  const baseConfig = JSON.parse(readFileSync(templatePath, 'utf-8'));

  // Internal tag conflict resolution within newOutbounds
  const seenTags = new Set<string>();
  const processedNewOutbounds = newOutbounds.map(outbound => {
    let uniqueTag = outbound.tag;
    let suffix = 1;
    
    // boundary: ensure uniqueness within newOutbounds only
    while (seenTags.has(uniqueTag)) {
      uniqueTag = `${outbound.tag}_${suffix}`;
      suffix++;
    }
    
    seenTags.add(uniqueTag);
    
    return {
      ...outbound,
      tag: uniqueTag
    };
  });
  

  // Generate region outbounds after deduplication
  const regionOutbounds = generateRegionOutbounds(processedNewOutbounds);
  
  let finalOutbounds = [...baseConfig.outbounds, ...processedNewOutbounds];
  let regionTags: string[] = [];
  
  if (regionOutbounds && regionOutbounds.length > 0) {
    // Add region outbounds to base config
    finalOutbounds = [...finalOutbounds, ...regionOutbounds];
    regionTags = regionOutbounds.map(outbound => outbound.tag);
    
    // Add region tags to predefined outbounds
    const proxyOutbound = finalOutbounds.find((outbound: any) => outbound.tag === "PROXY");
    proxyOutbound.outbounds.push(...regionTags);
    
    const autoOutbound = finalOutbounds.find((outbound: any) => outbound.tag === "auto");
    autoOutbound.outbounds.push(...regionTags);

    finalOutbounds.find((outbound: any) => outbound.tag === "AI").outbounds.push(...regionTags);
  }
  
  return {
    ...baseConfig,
    outbounds: finalOutbounds
  };
}