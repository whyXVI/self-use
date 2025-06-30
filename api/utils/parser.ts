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
  
  const newTags = processedNewOutbounds
    .map(outbound => outbound.tag);
  
  baseConfig.outbounds.find((outbound: any) => outbound.tag === "auto").outbounds.push(...newTags);
  
  return {
    ...baseConfig,
    outbounds: [...baseConfig.outbounds, ...processedNewOutbounds]
  };
}