import { OperationCanceledError, type CancellationToken } from '@puzzl/core/lib/async/cancellation';
import { HttpRequest, DownloadError } from '../network/HttpRequest'; // Assuming path and DownloadError export
import { resourceConfigs, ResourceType, type ResourceConfig, type ResourceId } from './resourceConfigs'; // Assuming path and exports

interface FetchResourceOptions {
  onProgress?: (loadedBytes: number) => void;
  // Potentially other options like signal from AbortController could be added
}

interface LoadResourceItem {
  id?: ResourceId; // id might be optional if src is a direct URL
  src: string;
  type: 'text' | 'binary' | 'json';
  sizeHint?: number;
}

export class LoaderResult {
  private items: Map<ResourceId, ArrayBuffer | string | any>; // string for text, ArrayBuffer for binary, any for json

  constructor(items: Map<ResourceId, ArrayBuffer | string | any>) {
    this.items = items;
  }

  pop(resourceIdentifier: ResourceType | ResourceId): ArrayBuffer | string | any {
    let resourceId: ResourceId;

    if (typeof resourceIdentifier === 'string') { // It's a ResourceId (string)
      resourceId = resourceIdentifier;
    } else { // It's a ResourceType (enum)
      const config = resourceConfigs.get(resourceIdentifier as ResourceType);
      if (!config) {
        throw new Error(`Missing resourceConfig for resource type "${ResourceType[resourceIdentifier as ResourceType]}"`);
      }
      if (!config.id) {
        throw new Error(`Undefined resourceId for resourceType ${ResourceType[resourceIdentifier as ResourceType]}`);
      }
      resourceId = config.id;
    }

    const item = this.items.get(resourceId);
    if (item === undefined) { // Check for undefined explicitly, as null might be a valid JSON response
      throw new Error(`Resource "${resourceId}" (from ${typeof resourceIdentifier === 'string' ? resourceIdentifier : ResourceType[resourceIdentifier as ResourceType]}) not found in result.`);
    }
    this.items.delete(resourceId);
    return item;
  }
}

export class ResourceLoader {
  private resourceBaseUrl: string;
  private httpRequest: HttpRequest;

  constructor(resourceBaseUrl: string) {
    this.resourceBaseUrl = resourceBaseUrl.endsWith('/') ? resourceBaseUrl : resourceBaseUrl + '/';
    this.httpRequest = new HttpRequest();
  }

  async prefetchResource(resourceType: ResourceType, cancellationToken?: CancellationToken): Promise<void> {
    const resourceConfig = resourceConfigs.get(resourceType);
    if (!resourceConfig) {
        throw new Error(`Missing resourceConfig for resType ${ResourceType[resourceType]}`);
    }
    const url = this.resourceBaseUrl + resourceConfig.src;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "fetch"; // "fetch" is a valid value for 'as' with prefetch
    link.href = url;
    link.crossOrigin = "anonymous";

    return new Promise<void>((resolve, reject) => {
      const cleanupAndReject = (error: Error) => {
        if (link.parentNode) {
          document.head.removeChild(link);
        }
        reject(error);
      };

      const cleanupAndResolve = () => {
        if (link.parentNode) {
          document.head.removeChild(link);
        }
        resolve();
      };

      cancellationToken?.register(() => {
        cleanupAndReject(new OperationCanceledError(cancellationToken));
      });

      if ("onload" in link) {
        link.onload = cleanupAndResolve;
      } else {
        // Fallback for browsers that don't support onload on link[rel=prefetch]
        // or if the prefetch is extremely fast (less likely but good to handle)
        // In such cases, append then immediately remove and resolve.
        // This doesn't guarantee prefetch completion but mimics original logic.
        document.head.appendChild(link);
        cleanupAndResolve(); 
        return;
      }
      
      if ("onerror" in link) {
        link.onerror = () => cleanupAndReject(new Error(`Couldn't prefetch URL "${url}"`));
      } else {
         // If no onerror, assume it won't fail or we can't detect failure for prefetch.
      }

      document.head.appendChild(link);
      // The original code had a fallback: `"onload" in s || (document.head.removeChild(s), e());`
      // This is now handled by the else block for `if ("onload" in link)`
    });
  }

  getResourceUrl(resourceTypeOrConfig: ResourceType | ResourceConfig): string {
    const config = typeof resourceTypeOrConfig === 'object' ? resourceTypeOrConfig : resourceConfigs.get(resourceTypeOrConfig);
    if (!config) {
      throw new Error(
        `Missing resourceConfig for resType ${ResourceType[resourceTypeOrConfig as ResourceType]}`,
      );
    }
    return this.resourceBaseUrl + config.src;
  }

  getResourceFileName(resourceType: ResourceType): string {
    const url = this.getResourceUrl(resourceType);
    const pathPart = url.split("?")[0];
    return pathPart.substring(pathPart.lastIndexOf('/') + 1);
  }

  buildResourceManifest(resources: (ResourceType | ResourceConfig)[]): LoadResourceItem[] {
    return resources
      .map((res): ResourceConfig => {
        if (typeof res === 'object') return res as ResourceConfig;
        const config = resourceConfigs.get(res as ResourceType);
        if (!config) {
          throw new Error(
            `Missing resourceConfig for resType ${ResourceType[res as ResourceType]}`,
          );
        }
        return config;
      })
      .map((config: ResourceConfig): LoadResourceItem => ({
        id: config.id,
        src: config.src.match(/^https?:\/\//)
          ? config.src
          : this.resourceBaseUrl + config.src, // Ensure base URL is prepended if src is relative
        type: config.type as 'text' | 'binary' | 'json', // Assuming config.type matches these
        sizeHint: config.sizeHint,
      }));
  }

  async loadText(srcRelative: string, cancellationToken?: CancellationToken, options?: FetchResourceOptions): Promise<string> {
    return await this.loadResource({ src: srcRelative, type: "text" }, cancellationToken, options) as string;
  }

  async loadBinary(srcRelative: string, cancellationToken?: CancellationToken, options?: FetchResourceOptions): Promise<ArrayBuffer> {
    return await this.loadResource({ src: srcRelative, type: "binary" }, cancellationToken, options) as ArrayBuffer;
  }

  async loadJson(srcRelative: string, cancellationToken?: CancellationToken, options?: FetchResourceOptions): Promise<any> {
    return await this.loadResource({ src: srcRelative, type: "json" }, cancellationToken, options);
  }

  private async loadResource(item: LoadResourceItem, cancellationToken?: CancellationToken, options?: FetchResourceOptions): Promise<ArrayBuffer | string | any> {
    // Ensure src is absolute, prepending resourceBaseUrl if it's not already an absolute URL
    const absoluteSrc = item.src.match(/^https?:\/\//) ? item.src : this.resourceBaseUrl + item.src;
    
    const result = await this.fetchResource(
      absoluteSrc,
      cancellationToken,
      options,
    );
    return this.httpRequest.parseResult(item.type, result);
  }

  async loadResources(resourceTypes: (ResourceType | ResourceConfig)[], cancellationToken?: CancellationToken, onTotalProgress?: (progressPercent: number) => void): Promise<LoaderResult> {
    const manifestItems = this.buildResourceManifest(resourceTypes);
    const resultsMap = new Map<ResourceId, ArrayBuffer | string | any>();
    const numItems = manifestItems.length;
    let completedItems = 0;
    
    const totalSizeHint = manifestItems.reduce((sum, item) => sum + (item.sizeHint ?? 0), 0);
    let totalLoadedBytes = 0;

    for (const item of manifestItems) {
      if (cancellationToken?.isCancellationRequested) {
        throw new OperationCanceledError(cancellationToken);
      }
      const itemProgress = { loadedBytes: 0 }; // Track loaded bytes for this item
      
      const response = await this.fetchResource(item.src, cancellationToken, {
        onProgress: (loadedBytesDelta) => {
          if (onTotalProgress && totalSizeHint > 0) {
            totalLoadedBytes += (loadedBytesDelta - itemProgress.loadedBytes); // Add diff from previous progress
            itemProgress.loadedBytes = loadedBytesDelta;
            onTotalProgress(Math.floor(100 * Math.min(1, totalLoadedBytes / totalSizeHint)));
          }
        },
      });
      if (item.id) { // Only store if item has an ID (from ResourceConfig)
        resultsMap.set(item.id, this.httpRequest.parseResult(item.type, response));
      }
      completedItems++;
      if (onTotalProgress && totalSizeHint === 0 && numItems > 0) { // Fallback if no size hints
        onTotalProgress(Math.floor((completedItems / numItems) * 100));
      }
    }
    return new LoaderResult(resultsMap);
  }

  protected async fetchResource(url: string, cancellationToken?: CancellationToken, options?: FetchResourceOptions): Promise<ArrayBuffer> {
    return await this.httpRequest.fetchRaw(url, cancellationToken, options?.onProgress);
  }
} 