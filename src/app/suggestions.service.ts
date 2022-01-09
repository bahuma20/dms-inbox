import { Injectable } from '@angular/core';
import {MayanService} from "./mayan.service";
import {DocumentType} from "./model/DocumentType";
import {Observable} from "rxjs";
import {HttpParams} from "@angular/common/http";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class SuggestionsService {

  constructor(private mayan: MayanService) { }

  suggestDocumentTitle(documentType: DocumentType, query: string): Observable<string[]> {
    let params = new HttpParams();
    params = params.set('_match_all', 'on');
    params = params.set('document_type__label', documentType.label);
    params = params.set('label', query);

    return this.mayan.searchDocuments(params)
      // Remove exact matches
      .pipe(map(documents => {
        return documents.filter(document => document.label !== query)
      }))
      // Return only labels
      .pipe(map(documents => {
        return documents.map(document => document.label);
      }))
      // Remove duplicates
      .pipe(map(documents => {
        return documents.filter((value, index, self) => {
          return self.indexOf(value) === index;
        });
      }))
      // Sort by most matched characters
      .pipe(map(documents => {
        const chars = query.split('');

        return documents.sort((a, b) => {
          let aCount = 0;
          chars.forEach(char => {
            if (a.indexOf(char) > 0) {
              aCount++
            }
          });

          let bCount = 0;
          chars.forEach(char => {
            if (b.indexOf(char) > 0) {
              bCount++
            }
          });

          return aCount - bCount;
        });
      }));
  }
}
