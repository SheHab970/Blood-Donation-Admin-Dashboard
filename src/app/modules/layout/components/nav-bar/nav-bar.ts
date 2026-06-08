import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../../Core/Services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../../Core/Services/inventory';


@Component({
  selector: 'app-nav-bar',
  imports: [CommonModule],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})
export class NavBar implements OnInit {
  constructor(private router: Router) {}

  private authService    = inject(AuthService);
  private inventoryService = inject(InventoryService);

  isAppAdmin = this.authService.isAppAdmin();
  isHospAdmin = this.authService.isHospitalAdmin();
  hospitalName :any;


  ngOnInit(): void {
    this.gethospitalName();
  }

  gethospitalName() {
    if (this.isHospAdmin) {
      this.inventoryService.getHospitalInventory().subscribe({
        next: (inventory) => {
          this.hospitalName = inventory;
        }
      });
    }
  }

getFullName() {
    return this.authService.getFullName() || 'User';
  }

  // UserName = this.getFullName();
  
  logout(): void {
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }

}
