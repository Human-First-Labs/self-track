import os from 'os'
import { spawn } from 'child_process'
import { app, dialog } from 'electron'

// Interface defining the structure for permission checks
export interface PermissionChecks {
  inputPermission: boolean // Indicates whether input device permissions are granted
}

// Function to check if the current user is in the 'input' group on Linux
const checkIfInInputGroup_linux = async (): Promise<boolean> => {
  // Spawn a child process to execute the 'groups' command
  const child = spawn('groups', [])

  return new Promise((resolve, reject) => {
    let output = '' // Variable to store the command output

    // Capture the standard output of the command
    child.stdout.on('data', (data) => {
      output += data.toString()
    })

    // Capture any errors from the command
    child.stderr.on('data', (data) => {
      console.error('Error checking user groups:', data.toString())
      reject('Error checking user groups:' + data.toString())
    })

    // Handle the command's exit event
    child.on('close', async (code) => {
      if (code !== 0) {
        console.error(`groups command exited with code ${code}`)
        reject(`groups command exited with code ${code}`)
      }

      // Check if the 'input' group is included in the output
      return resolve(output.includes('input'))
    })
  })
}

// Function to check permissions for interactivity tracking
const checkPermissions = async (): Promise<PermissionChecks> => {
  let checks: PermissionChecks = {
    inputPermission: false // Default to no input permission
  }

  // Check permissions based on the operating system
  if (os.platform() === 'linux') {
    // On Linux, check if the user is in the 'input' group
    const check = await checkIfInInputGroup_linux()

    if (check) {
      // If the user is in the 'input' group, grant input permission
      checks = {
        inputPermission: true
      }
    } else {
      // If not, show a warning dialog to the user
      const response = await dialog.showMessageBox({
        type: 'warning',
        title: 'Permission Required for Interactivity Tracking',
        message:
          "The application requires access to input devices to track interactivity. Please add your user to the 'input' group",
        detail:
          'To enable input device access, please run the following command:\n\nsudo usermod -aG input $USER\n\n' +
          'You may still use the application, but interactivity tracking will be disabled.\n\n' +
          'Log out and log back in for the changes to take effect',
        buttons: ['Continue', 'Close App']
      })

      checks = {
        inputPermission: false // Input permission remains disabled
      }

      if (response.response === 0) {
        // User chose to continue without input permissions
        return checks
      } else {
        // User chose to close the application
        app.quit()
      }
    }
  } else {
    // On non-Linux platforms, assume input permissions are granted
    checks = {
      inputPermission: true
    }
  }

  return checks
}

// Export the PermissionChecker object with the defined functions
export const PermissionChecker = {
  checkPermissions
}