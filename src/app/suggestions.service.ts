import {Injectable} from '@angular/core';
import {MayanService} from "./mayan.service";
import {DocumentType} from "./model/DocumentType";
import {distinct, from, mergeMap, Observable, toArray} from "rxjs";
import {HttpParams} from "@angular/common/http";
import {map} from "rxjs/operators";
import {Document} from "./model/Document";
import {Page} from "./model/Page";

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

  suggestDates(document: Document): Observable<Date[]> {
    let germanDateRegex = /(?<day>0?[1-9]|[1-2][0-9]|3[0-1])\.(?<month>0?[1-9]|1[0-2])\.(?<year>[0-9]{4})/g;

    return this.mayan.getDocumentFilePages(document, document.file_latest)
      .pipe(mergeMap(pages => from(pages)))
      .pipe(mergeMap((page: Page) => {
        return this.mayan.getDocumentFilePagesOcr(document, page);
      }))
      .pipe(map((ocrContent: string) => {
        return [...ocrContent.matchAll(germanDateRegex)]
          .map(match => `${match.groups!['year'].padStart(4, '0')}-${match.groups!['month'].padStart(2, '0')}-${match.groups!['day'].padStart(2, '0')}`)
          .map(dateString => new Date(dateString));
      }))
      .pipe(mergeMap(dates => from(dates)))
      .pipe(distinct(e => e.getTime()))
      .pipe(toArray())
  }
}
