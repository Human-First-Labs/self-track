import os from 'os'
import { spawn } from 'child_process'
import { app, dialog } from 'electron'

export interface PermissionChecks {
  inputPermission: boolean
}

const checkIfInInputGroup_linux = async (): Promise<boolean> => {
  const child = spawn('groups', [])

  return new Promise((resolve, reject) => {
    let output = ''
    child.stdout.on('data', (data) => {
      output += data.toString()
    })

    child.stderr.on('data', (data) => {
      console.error('Error checking user groups:', data.toString())
      reject('Error checking user groups:' + data.toString())
    })

    child.on('close', async (code) => {
      if (code !== 0) {
        console.error(`groups command exited with code ${code}`)
        reject(`groups command exited with code ${code}`)
      }

      return resolve(output.includes('input'))
    })
  })
}

const checkPermissions = async (): Promise<PermissionChecks> => {
  let checks: PermissionChecks = {
    inputPermission: false
  }

  if (os.platform() === 'linux') {
    const check = await checkIfInInputGroup_linux()

    if (check) {
      checks = {
        inputPermission: true
      }
    } else {
      // Show a dialog or notification to the user
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
        inputPermission: false
      }

      if (response.response === 0) {
        return checks
      } else {
        // close app
        app.quit()
      }
    }
  } else {
    checks = {
      inputPermission: true
    }
  }

  return checks
}

export const PermissionChecker = {
  checkPermissions
}
