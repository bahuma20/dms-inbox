import { Component, OnInit } from '@angular/core';
import {MayanService} from "../mayan.service";
import {Document} from "../model/Document";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent implements OnInit {
  loading = true;
  document: Document | undefined;
  imageUrl: SafeResourceUrl | undefined;

  constructor(private mayan: MayanService, private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

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
            })


        });
    });



  }

}
