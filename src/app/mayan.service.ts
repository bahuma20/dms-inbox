import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {mergeMap, Observable} from "rxjs";
import {environment} from "../environments/environment";
import {Document} from "./model/Document";
import {File} from "./model/File";
import {Page} from "./model/Page";
import {Metadata} from "./model/Metadata";
import {MetadataType} from "./model/MetadataType";
import {DocumentType} from "./model/DocumentType";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class MayanService {
  constructor(private http: HttpClient) {
  }

  listInboxDocuments(): Observable<Document[]> {
    return this.http.get(`${environment.apiUrl}/search/advanced/documents.DocumentSearchResult?document_type__label=INBOX`)
      .pipe(map((data: any) => {
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
    return this.http.get(`${environment.apiUrl}/document_types/`)
      .pipe(map((data: any) => {
        return data.results.map((entry: any) => MayanService.parseDocumentType(entry));
      }))
  }

  getDocumentTypeMetadataTypes(documentTypeId: number): Observable<MetadataType[]> {
    return this.http.get(`${environment.apiUrl}/document_types/${documentTypeId}/metadata_types`)
      .pipe(map((data: any) => {
        return data.results.map((entry: any) => MayanService.parseMetadataType(entry.metadata_type));
      }));
  }

  getDocumentMetadata(document: Document): Observable<Metadata[]> {
    return this.http.get(`${environment.apiUrl}/documents/${document.id}/metadata`)
      .pipe(map((data: any) => {
        let metadataList: Metadata[] = data.results.map((entry: any) => {
          let metadata: Metadata = {
            id: entry.id,
            type: MayanService.parseMetadataType(entry.metadata_type),
            value: entry.value,
          }

          return metadata;
        });

        return metadataList;
      }));
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

  private static parseDocumentType(entry: any): DocumentType {
    return {
      id: entry.id,
      label: entry.label,
    };
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
