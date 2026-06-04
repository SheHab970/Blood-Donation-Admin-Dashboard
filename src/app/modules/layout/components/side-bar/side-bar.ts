import { Component, EventEmitter, inject, Output } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../../Core/Services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-bar',
  imports: [NgClass, RouterLink, RouterModule, NgIf, CommonModule],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css',
})
export class SideBar {

  private authService    = inject(AuthService);

  isAppAdmin = this.authService.isAppAdmin();
  isHospAdmin = this.authService.isHospitalAdmin();

    @Output() sindeNavToggled = new EventEmitter<boolean>();
  menuStatus: boolean = false;

  SindeNavToggle() {
    this.menuStatus = !this.menuStatus;
    this.sindeNavToggled.emit(this.menuStatus);
    console.log(this.menuStatus);
  }

}
