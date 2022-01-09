import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {mergeMap, Observable, shareReplay} from "rxjs";
import {environment} from "../environments/environment";
import {Document} from "./model/Document";
import {File} from "./model/File";
import {Page} from "./model/Page";
import {Metadata} from "./model/Metadata";
import {MetadataType} from "./model/MetadataType";
import {DocumentType} from "./model/DocumentType";
import {map} from "rxjs/operators";
import {Tag} from "./model/Tag";

@Injectable({
  providedIn: 'root'
})
export class MayanService {
  private getAllDocumentTypesCache?: Observable<DocumentType[]>;
  private getDocumentTypeMetadataTypesCache: Map<number, Observable<MetadataType[]>> = new Map();

  constructor(private http: HttpClient) {
  }

  listInboxDocuments(): Observable<Document[]> {
    let params = new HttpParams();
    params = params.append('document_type__label', 'INBOX');

    return this.searchDocuments(params);
  }

  searchDocuments(parameters: HttpParams): Observable<Document[]> {
    return this.http.get(`${environment.apiUrl}/search/advanced/documents.DocumentSearchResult/`, {
      params: parameters
    }).pipe(map((data: any) => {
      return data.results.map((entry: any) => {
        return MayanService.parseDocument(entry);
      })
    }));
  }

  getDocument(documentId: number): Observable<Document> {
    return this.http.get(`${environment.apiUrl}/documents/${documentId}/`)
      .pipe(map((data: any) => {
        return MayanService.parseDocument(data);
      }));
  }

  getDocumentFilePages(document: Document, file: File): Observable<Page[]> {
    return this.http.get(`${environment.apiUrl}/documents/${document.id}/files/${file.id}/pages/`)
      .pipe(map((data: any) => {
        return data.results.map((entry: any) => {
          const page: Page = {
            id: entry.id,
            page_number: entry.page_number,
          };

          return page;
        });
      }));
  }

  getDocumentImage(document: Document, pageId: number, width?: number, height?: number): Observable<Blob> {
    return this.getDocumentFilePages(document, document.file_latest)
      .pipe(map(pages => {
        let imageUrl = `${environment.apiUrl}/documents/${document.id}/files/${document.file_latest.id}/pages/${pages[0].id}/image/`;

        let url = new URL(imageUrl);
        if (width || height) {
          url.searchParams.append('transformation_0_name', 'resize');
        }
        if (width) {
          url.searchParams.append('transformation_0_argument__width', String(width));
        }

        if (height) {
          url.searchParams.append('transformation_0_argument__height', String(height));
        }

        return this.http.get(url.toString(), {
          responseType: "blob"
        })
      }))
      .pipe(mergeMap(value => {
        return value;
      }));
  }

  getAllDocumentTypes(): Observable<DocumentType[]> {
    if (!this.getAllDocumentTypesCache) {
      this.getAllDocumentTypesCache = this.http.get(`${environment.apiUrl}/document_types/`)
        .pipe(map((data: any) => {
          return data.results.map((entry: any) => MayanService.parseDocumentType(entry));
        }))
        .pipe(shareReplay(1))
    }

    return this.getAllDocumentTypesCache;
  }

  getDocumentTypeMetadata(documentTypeId: number): Observable<Metadata[]> {
    if (!this.getDocumentTypeMetadataTypesCache.has(documentTypeId)) {
      this.getDocumentTypeMetadataTypesCache.set(documentTypeId, this.http.get(`${environment.apiUrl}/document_types/${documentTypeId}/metadata_types`)
        .pipe(map((data: any) => {
          return data.results.map((entry: any) => MayanService.parseMetadata(entry));
        }))
        .pipe(shareReplay(1)));
    }

    // @ts-ignore
    return this.getDocumentTypeMetadataTypesCache.get(documentTypeId);
  }

  getDocumentMetadata(document: Document): Observable<Metadata[]> {
    return this.http.get(`${environment.apiUrl}/documents/${document.id}/metadata/`)
      .pipe(map((data: any) => {
        let metadataList: Metadata[] = data.results.map((entry: any) => MayanService.parseMetadata(entry));

        return metadataList;
      }));
  }

  getAllTags(): Observable<Tag[]> {
    return this.http.get(`${environment.apiUrl}/tags/`)
      .pipe(map((data: any) => {
        return data.results.map((entry: any) => {
          return MayanService.parseTag(entry);
        })
      }));
  }

  createTag(label: string): Observable<Tag> {
    return this.http.post(`${environment.apiUrl}/tags/`, {
      color: '#000000',
      label: label,
    }).pipe(map(data => {
      return MayanService.parseTag(data);
    }));
  }

  attachTagToDocument(document: Document, tag: Tag): Observable<any> {
    return this.http.post(`${environment.apiUrl}/documents/${document.id}/tags/attach/`, {
      tag: tag.id,
    });
  }

  private static parseDocument(entry: any): Document {
    return {
      id: entry.id,
      uuid: entry.uuid,
      label: entry.label,
      datetime_created: new Date(entry.datetime_created),
      document_type: this.parseDocumentType(entry.document_type),
      file_latest: {
        id: entry.file_latest.id,
        timestamp: new Date(entry.file_latest.timestamp),
        filename: entry.file_latest.filename,
        file: entry.file_latest.file
      }
    };
  }

  changeDocumentType(document: Document, documentType: DocumentType): Observable<any> {
    return this.http.post(`${environment.apiUrl}/documents/${document.id}/type/change/`, {
      document_type_id: documentType.id
    });
  }

  setDocumentLabel(document: Document, label: string): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/documents/${document.id}/`, {
      label: label
    });
  }

  setMetadataItem(document: Document, metadataItemId: number, value: any): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/documents/${document.id}/metadata/${metadataItemId}/`, {
      value
    });
  }

  addMetadataItem(document: Document, metadataTypeId: number, value: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/documents/${document.id}/metadata/`, {
      metadata_type_id: metadataTypeId,
      value,
    });
  }

  private static parseTag(entry: any): Tag {
    return {
      id: entry.id,
      label: entry.label,
      color: entry.color,
    };
  }

  private static parseDocumentType(entry: any): DocumentType {
    return {
      id: entry.id,
      label: entry.label,
    };
  }

  private static parseMetadata(entry: any): Metadata {
    return {
      id: entry.id,
      type: MayanService.parseMetadataType(entry.metadata_type),
      value: entry.value,
      required: entry.required,
    }
  }

  private static parseMetadataType(entry: any): MetadataType {
    return {
      id: entry.id,
      label: entry.label,
      name: entry.name,
      parser: entry.parser,
      validation: entry.validation,
      default: entry.default,
    }
  }
}
