import React from 'react';
import { Mail, Phone, Globe, Shield } from 'lucide-react';

export default function OnboardingFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            {/* Company Info */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>hr@nxzen.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>

            {/* Links */}
           

            {/* Copyright */}
            <div className="text-sm text-gray-500">
              © 2024 Onboarding Portal. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}