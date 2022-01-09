import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {MayanService} from "../mayan.service";
import {Document} from "../model/Document";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";
import {MetadataService} from "../metadata.service";
import {DocumentType} from "../model/DocumentType";
import {Metadata} from "../model/Metadata";
import {AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators} from "@angular/forms";
import {Tag} from "../model/Tag";
import {concat, debounceTime, finalize, Observable, switchMap, tap} from "rxjs";
import {SuggestionsService} from "../suggestions.service";

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent implements OnInit {
  loading = true;
  metadataLoading = false;
  submitLoading = false;

  document?: Document;
  imageUrl?: SafeResourceUrl;
  availableDocumentTypes?: DocumentType[];
  selectedDocumentType?: DocumentType;
  metadata?: Metadata[];

  form?: FormGroup;
  tags: Tag[] = [];
  submitProgress: number = 0;

  @ViewChild('labelInput') labelInput?: ElementRef;
  labelSuggestions: string[] = [];
  labelSuggestionsLoading = false;

  constructor(private mayan: MayanService,
              private route: ActivatedRoute,
              private sanitizer: DomSanitizer,
              private metadataService: MetadataService,
              private suggestionsService: SuggestionsService,
              private fb: FormBuilder,
              private router: Router) {
  }

  ngOnInit(): void {
    // Initialize form
    this.form = this.fb.group({
      label: new FormControl(null, Validators.required),
    });


    // Add label autocomplete pipe
    this.form.controls['label'].valueChanges.pipe(
      debounceTime(300),
      tap(() => {
        this.labelSuggestions = [];
        this.labelSuggestionsLoading = true;
      }),
      switchMap(value => {
        if (!this.selectedDocumentType) {
          return [];
        }

        return this.suggestionsService.suggestDocumentTitle(this.selectedDocumentType, value)
          .pipe(
            finalize(() => {
              this.labelSuggestionsLoading = false;
            })
          )

      })
    ).subscribe(suggestions => {
      this.labelSuggestions = suggestions;
    });


    // Load document by id from route
    this.route.paramMap.subscribe(params => {
      this.loading = true;
      let documentId = params.get('documentId');
      this.tags = [];

      this.mayan.getDocument(Number(documentId))
        .subscribe(document => {
          this.loading = false;
          this.document = document;
          this.form?.setValue({
            label: document.label
          });

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

    if (!this.document) {
      return
    }

    this.metadataService.getAvailableMetadata(this.document, documentType.id)
      .subscribe(metadata => {
        metadata.sort((a, b) => {
          if (a.type.parser == 'mayan.apps.metadata.parsers.DateParser' && b.type.parser !== 'mayan.apps.metadata.parsers.DateParser') {
            return -1;
          }

          if (b.type.parser == 'mayan.apps.metadata.parsers.DateParser' && a.type.parser !== 'mayan.apps.metadata.parsers.DateParser') {
            return 1;
          }

          if (a.required && !b.required) {
            return -1;
          }

          if (b.required && !a.required) {
            return 1;
          }

          return a.type.label.localeCompare(b.type.label);
        });

        this.metadata = metadata;

        let newMetadataFormGroup = this.fb.group({});
        this.metadata.forEach(met => {
          let validators: ValidatorFn[] = [];

          if (met.required) {
            validators.push(Validators.required);
          }

          newMetadataFormGroup.addControl(met.type.name, this.fb.control(null, validators));
        });

        this.form?.removeControl('metadata');
        this.form?.addControl('metadata', newMetadataFormGroup);

        this.metadataLoading = false;
      });
  }

  getFieldType(metadata: Metadata) {
    if (metadata.type.parser == 'mayan.apps.metadata.parsers.DateParser') {
      return 'date';
    }

    return 'text';
  }

  getErrorMessage(abstractControl?: AbstractControl | null): string {
    if (!abstractControl) {
      return '';
    }

    if (abstractControl.hasError('required')) {
      return 'Dieses Feld ist erforderlich';
    }

    return '';
  }

  submitForm(metadata: Metadata[]) {
    if (!this.document || !this.selectedDocumentType) {
      return;
    }

    if (!this.form?.valid) {
      return;
    }

    this.submitLoading = true;

    let actions: Observable<any>[] = [];

    // Change Document type
    actions.push(this.mayan.changeDocumentType(this.document, this.selectedDocumentType));


    // Set label
    let newLabel = this.form?.get('label')?.value;
    if (newLabel !== this.document.label) {
      actions.push(this.mayan.setDocumentLabel(this.document, newLabel));
    }


    // Add metadata
    metadata = metadata.map(met => {
      met.value = this.form?.get('metadata')?.get(met.type.name)?.value;
      return met;
    });

    actions.push(this.metadataService.setDocumentMetadata(this.document, metadata));


    // Set tags
    this.tags.forEach(tag => {
      actions.push(this.mayan.attachTagToDocument(this.document!, tag));
    });


    // Execute
    this.submitProgress = 0;
    let finishedActionCount = 0;

    concat(...actions)
      .subscribe({
        next: () => {
          finishedActionCount++;
          this.submitProgress = finishedActionCount / actions.length;
        },
        complete: () => {
          this.submitLoading = false;
          this.router.navigate(['']);
        }
      })
  }

  onLabelFocusIn() {
    if (this.form?.get('label')?.value == this.document?.label) {
      this.form?.get('label')?.setValue('');
      this.form?.get('label')?.markAsTouched();
    }
  }

  restoreLabel($event: MouseEvent) {
      $event.preventDefault();
      this.labelInput?.nativeElement.blur();

      setTimeout(() => {
        this.form?.get('label')?.setValue(this.document?.label);
      }, 100)

  }
}
