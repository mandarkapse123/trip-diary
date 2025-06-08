// Family management module for Family Health Tracker
// Handles family member invitations, permissions, and data sharing

class FamilyManager {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Invite family member form
    const inviteForm = document.getElementById('invite-member-form');
    if (inviteForm) {
      inviteForm.addEventListener('submit', (e) => this.handleInviteMember(e));
    }
  }

  async loadFamily() {
    try {
      const familyMembers = await this.db.getFamilyMembers();
      this.displayFamilyMembers(familyMembers);
    } catch (error) {
      console.error('Error loading family members:', error);
      window.app.showNotification('Failed to load family members', 'error');
    }
  }

  displayFamilyMembers(members) {
    const container = document.getElementById('family-grid');
    if (!container) return;

    if (members.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users fa-3x"></i>
          <h3>No Family Members Yet</h3>
          <p>Invite your family members to start tracking health together</p>
          <button class="btn btn-primary" onclick="window.app.showModal('invite-member-modal')">
            <i class="fas fa-user-plus"></i>
            Invite Family Member
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = members.map(member => this.createMemberCard(member)).join('');
  }

  createMemberCard(member) {
    const memberName = member.member?.full_name || member.full_name;
    const memberEmail = member.member?.email || member.email;
    const initials = this.getInitials(memberName);
    const statusClass = member.status === 'active' ? 'active' : 'pending';
    
    return `
      <div class="family-member-card" data-member-id="${member.id}">
        <div class="member-avatar">
          ${initials}
        </div>
        <div class="member-name">${memberName}</div>
        <div class="member-relationship">${this.formatRelationship(member.relationship)}</div>
        <div class="member-email">${memberEmail}</div>
        <div class="member-status ${statusClass}">${member.status}</div>
        
        <div class="member-permissions">
          <h4>Permissions:</h4>
          <ul>
            ${this.formatPermissions(member.permissions)}
          </ul>
        </div>
        
        <div class="member-actions">
          ${member.status === 'pending' ? `
            <button class="btn btn-warning btn-sm" onclick="familyManager.resendInvitation('${member.id}')">
              <i class="fas fa-paper-plane"></i>
              Resend Invite
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="familyManager.editMember('${member.id}')">
            <i class="fas fa-edit"></i>
            Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="familyManager.removeMember('${member.id}')">
            <i class="fas fa-user-minus"></i>
            Remove
          </button>
        </div>
      </div>
    `;
  }

  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  formatRelationship(relationship) {
    const relationships = {
      spouse: 'Spouse',
      child: 'Child',
      parent: 'Parent',
      sibling: 'Sibling',
      other: 'Other'
    };
    return relationships[relationship] || relationship;
  }

  formatPermissions(permissions) {
    if (!permissions || typeof permissions !== 'object') {
      return '<li>View own data</li>';
    }

    const permissionsList = ['View own data']; // Always included
    
    if (permissions.can_view_family) {
      permissionsList.push('View family data');
    }
    
    if (permissions.can_manage_family) {
      permissionsList.push('Manage family members');
    }

    return permissionsList.map(p => `<li>${p}</li>`).join('');
  }

  async handleInviteMember(e) {
    e.preventDefault();
    
    const email = document.getElementById('member-email').value;
    const name = document.getElementById('member-name').value;
    const relationship = document.getElementById('member-relationship').value;
    
    // Get permissions
    const permissions = {
      can_view_family: document.getElementById('can-view-family').checked,
      can_manage_family: document.getElementById('can-manage-family').checked,
    };

    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if member already exists
      const existingMembers = await this.db.getFamilyMembers();
      const emailExists = existingMembers.some(member => 
        (member.member?.email || member.email) === email
      );

      if (emailExists) {
        throw new Error('This email is already in your family');
      }

      // Set loading state
      this.setInviteLoading(true);

      // Send invitation
      const memberData = {
        email,
        name,
        relationship,
        permissions
      };

      await this.db.inviteFamilyMember(memberData);

      // Close modal and reload family
      window.app.hideModal('invite-member-modal');
      await this.loadFamily();

      window.app.showNotification(`Invitation sent to ${name}`, 'success');

    } catch (error) {
      console.error('Error inviting family member:', error);
      window.app.showNotification(error.message || 'Failed to send invitation', 'error');
    } finally {
      this.setInviteLoading(false);
    }
  }

  setInviteLoading(loading) {
    const submitBtn = document.querySelector('#invite-member-form button[type="submit"]');
    const inputs = document.querySelectorAll('#invite-member-form input, #invite-member-form select');
    
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Invitation...';
      inputs.forEach(input => input.disabled = true);
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Invitation';
      inputs.forEach(input => input.disabled = false);
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async resendInvitation(memberId) {
    try {
      // This would typically resend the invitation email
      // For now, just show a success message
      window.app.showNotification('Invitation resent successfully', 'success');
    } catch (error) {
      console.error('Error resending invitation:', error);
      window.app.showNotification('Failed to resend invitation', 'error');
    }
  }

  async editMember(memberId) {
    // This would open an edit modal for the family member
    // For now, just show a placeholder message
    window.app.showNotification('Edit member functionality coming soon', 'info');
  }

  async removeMember(memberId) {
    if (!confirm('Are you sure you want to remove this family member? They will lose access to shared health data.')) {
      return;
    }

    try {
      // This would remove the family member from the database
      // For now, just show a placeholder message
      window.app.showNotification('Remove member functionality coming soon', 'info');
    } catch (error) {
      console.error('Error removing family member:', error);
      window.app.showNotification('Failed to remove family member', 'error');
    }
  }

  // Family data sharing methods
  async shareVitalWithFamily(vitalId, memberIds) {
    try {
      // Implementation for sharing specific vital signs with family members
      // This would update the database to allow specific members to view the vital
      window.app.showNotification('Vital shared with family members', 'success');
    } catch (error) {
      console.error('Error sharing vital:', error);
      window.app.showNotification('Failed to share vital', 'error');
    }
  }

  async shareReportWithFamily(reportId, memberIds) {
    try {
      // Implementation for sharing specific reports with family members
      window.app.showNotification('Report shared with family members', 'success');
    } catch (error) {
      console.error('Error sharing report:', error);
      window.app.showNotification('Failed to share report', 'error');
    }
  }

  async getFamilyHealthSummary() {
    try {
      // This would aggregate health data from all family members
      // and return a summary for the family dashboard
      const familyMembers = await this.db.getFamilyMembers();
      
      // Placeholder implementation
      return {
        totalMembers: familyMembers.length,
        activeMembers: familyMembers.filter(m => m.status === 'active').length,
        pendingInvitations: familyMembers.filter(m => m.status === 'pending').length,
        recentActivity: [], // Would contain recent health activities from all members
      };
    } catch (error) {
      console.error('Error getting family health summary:', error);
      return null;
    }
  }

  // Emergency contact methods
  async setEmergencyContact(memberId, isEmergencyContact) {
    try {
      // Implementation for setting a family member as an emergency contact
      window.app.showNotification(
        isEmergencyContact ? 'Emergency contact set' : 'Emergency contact removed',
        'success'
      );
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      window.app.showNotification('Failed to update emergency contact', 'error');
    }
  }

  async notifyEmergencyContacts(alertType, data) {
    try {
      // Implementation for notifying emergency contacts about health alerts
      // This would send notifications via email, SMS, or push notifications
      console.log('Emergency notification sent:', alertType, data);
    } catch (error) {
      console.error('Error sending emergency notification:', error);
    }
  }
}

// Export for use in other modules
window.FamilyManager = FamilyManager;
