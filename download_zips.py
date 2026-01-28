# import requests

# # download_zips.py - MOCK MODE (WORKS IMMEDIATELY)
# import os
# import smartsheet
# import os
# import requests
# import zipfile
# from datetime import datetime

# SMARTSHEET_TOKEN = "7xcmOm3neR6SXBXda7fY9qis3Bg9z9VsBZ6T6"
# SHEET_ID = "7220178429366148"
#!/usr/bin/env python3

#!/usr/bin/env python3
"""
Script to download all attachments from a Smartsheet sheet.
Requires: pip install requests --break-system-packages
"""
"""
Script to download all attachments from a Smartsheet sheet.
Requires: pip install requests --break-system-packages
"""

import requests
import os
import sys
from pathlib import Path


class SmartsheetAttachmentDownloader:
    def __init__(self, access_token, sheet_id):
        """
        Initialize the downloader with authentication credentials.
        
        Args:
            access_token (str): Smartsheet API access token
            sheet_id (str): ID of the sheet to download attachments from
        """
        self.access_token = access_token
        self.sheet_id = sheet_id
        self.base_url = "https://api.smartsheet.com/2.0"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    def get_row_attachments(self):
        """
        Fetch all rows and return all their attachments.
        
        Returns:
            list: List of all attachment objects from all rows
        """
        print("📥 Fetching rows from Smartsheet...")

        all_attachments = []
        
        # Smartsheet API returns all rows by default in a single request
        url = f"{self.base_url}/sheets/{self.sheet_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            sheet_data = response.json()

            rows = sheet_data.get("rows", [])
            print(f"  → Found {len(rows)} rows")

            for i, row in enumerate(rows, 1):
                row_id = row.get("id")
                if not row_id:
                    continue

                if i % 10 == 0:  # Progress update every 10 rows
                    print(f"  → Processing row {i}/{len(rows)}...")

                attachments = self.get_attachments_for_row(row_id)
                all_attachments.extend(attachments)

        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching rows: {e}")

        print(f"✓ Total attachments found: {len(all_attachments)}")
        return all_attachments

    def get_attachments_for_row(self, row_id):
        """
        Get all attachments for a specific row.
        
        Args:
            row_id (str): ID of the row
            
        Returns:
            list: List of attachment objects
        """
        url = f"{self.base_url}/sheets/{self.sheet_id}/rows/{row_id}/attachments"

        try:
            response = requests.get(url, headers=self.headers, timeout=20)
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching attachments for row {row_id}: {e}")
            return []
    
    def get_attachment_url(self, attachment_id):
        """
        Get the download URL for an attachment.
        
        Args:
            attachment_id (str): ID of the attachment
            
        Returns:
            str: Download URL or None if not found
        """
        url = f"{self.base_url}/sheets/{self.sheet_id}/attachments/{attachment_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data.get('url')
        except requests.exceptions.RequestException as e:
            print(f"Error fetching attachment URL: {e}")
            return None
    
    def download_attachment(self, attachment, output_dir):
        """
        Download a single attachment to the specified directory.
        Skips download if file already exists.
        
        Args:
            attachment (dict): Attachment object containing id, name, and url
            output_dir (str): Directory to save the file
            
        Returns:
            tuple: (success: bool, error_message: str or None)
        """
        attachment_id = attachment.get('id')
        attachment_name = attachment.get('name', f'attachment_{attachment_id}')
        attachment_url = attachment.get('url')

        if not attachment_url:
            print(f"Fetching URL for: {attachment_name}")
            attachment_url = self.get_attachment_url(attachment_id)

        if not attachment_url:
            error_msg = "Could not get download URL"
            print(f"✗ {error_msg} for attachment: {attachment_name}")
            return False, error_msg

        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        file_path = os.path.join(output_dir, attachment_name)

        # Skip download if file already exists
        if os.path.exists(file_path):
            print(f"⏭ Already exists, skipping: {attachment_name}")
            return True, None

        try:
            download_headers = {}
            if not attachment_url.startswith('https://s3.amazonaws.com/'):
                download_headers = self.headers

            response = requests.get(attachment_url, headers=download_headers, stream=True)
            response.raise_for_status()

            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"✓ Downloaded: {attachment_name}")
            return True, None

        except requests.exceptions.RequestException as e:
            error_msg = f"Download error: {e}"
            print(f"✗ Error downloading {attachment_name}: {e}")
            return False, error_msg
        except IOError as e:
            error_msg = f"Save error: {e}"
            print(f"✗ Error saving {attachment_name}: {e}")
            return False, error_msg
    
    def download_all_attachments(self, output_dir="smartsheet_attachments"):
        """
        Download all row attachments from the sheet.
        
        Args:
            output_dir (str): Directory to save attachments
            
        Returns:
            list: List of failed files with details
        """
        print(f"Starting download of row attachments from sheet {self.sheet_id}...")
        print("-" * 60)
        
        total_downloaded = 0
        total_skipped = 0
        total_failed = 0
        failed_files = []
        
        # Get all row attachments
        print("\n[Row Attachments]")
        attachments = self.get_row_attachments()

        if attachments:
            # Create output directory
            Path(output_dir).mkdir(parents=True, exist_ok=True)
            
            print(f"\nDownloading to: {os.path.abspath(output_dir)}\n")
            
            for i, attachment in enumerate(attachments, 1):
                print(f"[{i}/{len(attachments)}] ", end="")
                
                # Check if file exists before attempting download
                attachment_id = attachment.get('id')
                attachment_name = attachment.get('name', f'attachment_{attachment_id}')
                file_path = os.path.join(output_dir, attachment_name)
                
                if os.path.exists(file_path):
                    print(f"⏭ Already exists, skipping: {attachment_name}")
                    total_skipped += 1
                else:
                    success, error_msg = self.download_attachment(attachment, output_dir)
                    if success:
                        total_downloaded += 1
                    else:
                        total_failed += 1
                        failed_files.append({
                            'name': attachment_name,
                            'id': attachment_id,
                            'error': error_msg
                        })
        else:
            print("No row attachments found.")
        
        # Summary
        print("\n" + "=" * 60)
        print(f"Download complete!")
        print(f"Total downloaded: {total_downloaded}")
        print(f"Total skipped (already exists): {total_skipped}")
        print(f"Total failed: {total_failed}")
        print(f"Output directory: {os.path.abspath(output_dir)}")
        
        # Show failed files details
        if failed_files:
            print("\n" + "=" * 60)
            print("❌ FAILED FILES:")
            print("-" * 60)
            for i, failed in enumerate(failed_files, 1):
                print(f"  {i}. {failed['name']}")
                print(f"     ID: {failed['id']}")
                print(f"     Error: {failed['error']}")
                print()
        
        print("=" * 60)
        
        return failed_files


def main():
    """Main function to run the script."""
    
    # Get inputs
    if len(sys.argv) >= 3:
        access_token = sys.argv[1]
        sheet_id = sys.argv[2]
        output_dir = sys.argv[3] if len(sys.argv) > 3 else "smartsheet_attachments"
    else:
        print("Smartsheet Attachment Downloader")
        print("=" * 60)
        access_token = input("Enter your Smartsheet API access token: ").strip()
        sheet_id = input("Enter the Sheet ID: ").strip()
        output_dir = input("Enter output directory (default: smartsheet_attachments): ").strip()
        if not output_dir:
            output_dir = "smartsheet_attachments"
    
    if not access_token or not sheet_id:
        print("Error: Access token and Sheet ID are required!")
        print("\nUsage:")
        print("  python download_smartsheet_attachments.py <access_token> <sheet_id> [output_dir]")
        print("\nOr run without arguments for interactive mode.")
        sys.exit(1)
    
    # Create downloader and run
    downloader = SmartsheetAttachmentDownloader(access_token, sheet_id)
    failed_files = downloader.download_all_attachments(output_dir)
    
    # Exit with error code if there were failures
    if failed_files:
        sys.exit(1)


if __name__ == "__main__":
    main()