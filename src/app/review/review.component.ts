import { Component, OnInit } from '@angular/core';
import {MayanService} from "../mayan.service";
import {Document} from "../model/Document";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ActivatedRoute} from "@angular/router";
import {MetadataService} from "../metadata.service";
import {DocumentType} from "../model/DocumentType";
import {Metadata} from "../model/Metadata";

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent implements OnInit {
  loading = true;
  metadataLoading = false;
  document?: Document;
  imageUrl?: SafeResourceUrl;
  availableDocumentTypes?: DocumentType[];
  selectedDocumentType?: DocumentType;
  metadata?: Metadata[];

  constructor(private mayan: MayanService, private route: ActivatedRoute, private sanitizer: DomSanitizer, private metadataService: MetadataService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.loading = true;
      let documentId = params.get('documentId');

      this.mayan.getDocument(Number(documentId))
        .subscribe(document => {
          this.loading = false;
          this.document = document;

          this.mayan.getDocumentFilePages(document, document.file_latest)
            .subscribe(pages => {
              this.mayan.getDocumentImage(document, pages[0].id, 1000)
                .subscribe(image => {
                  this.imageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(image));
                });
            });

          this.mayan.getAllDocumentTypes()
            .subscribe(documentTypes => {
              documentTypes = documentTypes.filter(value => value.label !== 'INBOX');
              this.availableDocumentTypes = documentTypes;
            });
        });
    });
  }

  selectDocumentType(documentType: DocumentType) {
    this.metadataLoading = true;
    this.selectedDocumentType = documentType;

    if (this.document) {
      this.metadataService.getAvailableMetadata(this.document, documentType.id)
        .subscribe(metadata => {
          metadata.sort((a, b) => {
            if (a.type.parser == 'mayan.apps.metadata.parsers.DateParser') {
              return -1;
            }

            return 0;
          });

          this.metadata = metadata;

          this.metadataLoading = false;
        });
    }
  }

  getFieldType(met: Metadata) {
    if (met.type.parser == 'mayan.apps.metadata.parsers.DateParser') {
      return 'date';
    }

    return 'text';
  }
}
