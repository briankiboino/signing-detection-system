import {Component, OnInit} from '@angular/core';
import {Select, Store} from '@ngxs/store';
import {Observable} from 'rxjs';
import {filter, tap} from 'rxjs/operators';
import {MatProgressSpinner, MatSpinner} from '@angular/material/progress-spinner';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {DisplayError, ResetError} from './core/modules/ngxs/store/app/app.actions';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AudioInstructionsComponent} from './components/audio/audio-instructions/audio-instructions.component';
import {TranslocoService} from '@ngneat/transloco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @Select(state => state.app.isLoading) isLoading$: Observable<boolean>;
  @Select(state => state.app.error) error$: Observable<string>;
  @Select(state => state.audio.error) audioError$: Observable<string>;

  loaderDialog: MatDialogRef<MatProgressSpinner>;

  constructor(private dialog: MatDialog,
              private transloco: TranslocoService,
              private snackBar: MatSnackBar,
              private store: Store) {
  }

  ngOnInit(): void {
    this.manageLoading();
    this.manageAppErrors();
    this.manageAudioErrors();
  }

  manageLoading(): void {
    this.isLoading$.pipe(
      filter(isLoading => isLoading || Boolean(this.loaderDialog)),
      tap(isLoading => {
        if (isLoading) {
          this.loaderDialog = this.dialog.open(MatSpinner, {panelClass: 'app-loader-dialog'});
        } else {
          this.loaderDialog.close();
          delete this.loaderDialog;
        }
      })
    ).subscribe();
  }

  manageAppErrors(): void {
    this.error$.pipe(
      filter(Boolean),
      tap((error: string) => {
        this.store.dispatch(new ResetError());

        this.snackBar.open(error, null, {
          panelClass: 'mat-warn',
          duration: 10000
        });
      })
    ).subscribe();
  }

  manageAudioErrors(): void {
    this.audioError$.pipe(
      filter(Boolean),
      tap(async (error: string) => {
        switch (error) {
          case 'missingSpeaker':
            this.dialog.open(AudioInstructionsComponent);
            break;
          default:
            const translation = await this.transloco.translate('audio.errors.' + error);
            this.store.dispatch(new DisplayError(translation));
        }
      })
    ).subscribe();
  }
}
