import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
})
export class PostComponent implements OnInit, OnDestroy {
  post$: Observable<any>;
  postMetaSubscription: Subscription;
  constructor(
    private _http: HttpClient,
    private _route: ActivatedRoute,
    private metaService: Meta,
  ) {}

  ngOnInit() {
    this.post$ = this._route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        console.log(params.get('id'));
        const url =
          'https://knochenbruchgilde.firebaseio.com/posts/' +
          params.get('id') +
          '.json';
        return this._http.get(url);
      }),
    );
    this._route.paramMap.subscribe((params: ParamMap) =>
      console.log(params.get('id')),
    );
    this.postMetaSubscription = this.post$.subscribe(post => {
      this.metaService.addTag({ property: 'twitter:card', content: 'summary' });
      this.metaService.addTag({ property: 'og:title', content: post.title });
      this.metaService.addTag({ property: 'og:image', content: post.imgUrl });
    });
  }
  ngOnDestroy() {
    this.postMetaSubscription.unsubscribe();
  }
}
