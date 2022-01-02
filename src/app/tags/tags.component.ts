import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MayanService} from "../mayan.service";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormControl} from "@angular/forms";
import {filter, mergeMap, Observable, startWith, switchMap, toArray} from "rxjs";
import {Tag} from "../model/Tag";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {map} from "rxjs/operators";

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit {
  separatorKeyCodes: number[] = [ENTER, COMMA];
  tagCtrl = new FormControl();
  availableTags: Observable<Tag[]>;
  filteredTags?: Observable<Tag[]>;
  @Input() tags: Tag[] = [];

  @Output() tagsChanged = new EventEmitter<Tag[]>();

  @ViewChild('tagInput') tagInput?: ElementRef<HTMLInputElement>;

  constructor(private mayan: MayanService) {
    this.availableTags = mayan.getAllTags();
  }

  ngOnInit(): void {
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(''),
      filter(value => {
        return typeof value == "string";
      }),
      map((value: string) => {
        return value.toLowerCase()
      }),
      switchMap(value => {
        return this.availableTags.pipe(
          mergeMap(tags => tags),
          filter(tag => {
            return tag.label.toLowerCase().indexOf(value) !== -1;
          }),
          filter(tag => {
            let result = this.tags.filter(entry => {
              return entry.id == tag.id;
            });

            return result.length == 0;
          }),
          toArray())
      }),
    );
  }

  add(event: MatChipInputEvent): void {
    const label = (event.value || '').trim();
    if (label == '') {
      return;
    }

    this.mayan.createTag(label)
      .subscribe(tag => {
        this.tags.push(tag);
        event.chipInput!.clear();

        this.tagCtrl.setValue(null);
        this.tagsChanged.emit(this.tags);
      });
  }

  remove(tagId: number): void {
    this.tags = this.tags.filter(item => item.id != tagId);
    this.tagsChanged.emit(this.tags);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.tags.push(event.option.value);
    if (this.tagInput) {
      this.tagInput.nativeElement.value = '';
    }
    this.tagCtrl.setValue(null);
    this.tagsChanged.emit(this.tags);
  }

  getFontColor(backgroundColor: string) {
    let brightness = TagsComponent.getColorBrightness(backgroundColor);

    return (brightness > 125) ? '#000000' : '#ffffff';
  }

  getButtonColor(backgroundColor: string) {
    let brightness = TagsComponent.getColorBrightness(backgroundColor);
    return (brightness > 125) ? 'rgba(0,0,0,.87)' : 'rgba(255,255,255,.87)';
  }

  private static getColorBrightness(color: string): number {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    let colorRgb = result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;

    if (!colorRgb) {
      return 0;
    }

    // http://www.w3.org/TR/AERT#color-contrast
    return Math.round((colorRgb.r * 299 + colorRgb.g * 587 + colorRgb.b * 114) / 1000);
  }
}
