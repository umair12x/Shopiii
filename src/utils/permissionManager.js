import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Alert } from 'react-native';

const getCameraRequestPermissionFn = () => {
  return (
    Camera.requestCameraPermissionsAsync ||
    (Camera.Camera && Camera.Camera.requestCameraPermissionsAsync) ||
    Camera.requestPermissionsAsync ||
    (Camera.Camera && Camera.Camera.requestPermissionsAsync)
  );
};

const getCameraCheckPermissionFn = () => {
  return (
    Camera.getCameraPermissionsAsync ||
    (Camera.Camera && Camera.Camera.getCameraPermissionsAsync) ||
    Camera.getPermissionsAsync ||
    (Camera.Camera && Camera.Camera.getPermissionsAsync)
  );
};

/**
 * Request camera permission
 */
export const requestCameraPermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return { status: 'granted' }; // Web doesn't need explicit permissions
    }

    const requestPermission = getCameraRequestPermissionFn();
    if (!requestPermission) {
      throw new Error('Camera permission API is not available in this expo-camera version.');
    }

    const result = await requestPermission();
    return result;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return { status: 'denied' };
  }
};

/**
 * Check if camera permission is granted
 */
export const checkCameraPermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return true;
    }

    const getPermission = getCameraCheckPermissionFn();
    if (!getPermission) {
      return false;
    }

    const result = await getPermission();
    return result.status === 'granted';
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Request media library/storage permission with user prompt
 */
export const requestStoragePermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return { status: 'granted' };
    }

    // Android 10+ does not expose a classic "Storage" app toggle.
    // We use folder picker/share flow for exports, so treat as granted here.
    if (Platform.OS === 'android') {
      return { status: 'granted' };
    }

    // First check current status
    const current = await MediaLibrary.getPermissionsAsync();
    
    // If already granted or web, return
    if (current.granted) {
      return { status: 'granted' };
    }

    // Request permission - this will show native permission dialog
    const result = await MediaLibrary.requestPermissionsAsync();
    return { status: result.granted ? 'granted' : 'denied' };
  } catch (error) {
    console.error('Error requesting storage permission:', error);
    return { status: 'denied' };
  }
};

/**
 * Check if storage permission is granted
 */
export const checkStoragePermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return true;
    }

    if (Platform.OS === 'android') {
      return true;
    }

    const result = await MediaLibrary.getPermissionsAsync();
    return result.granted;
  } catch (error) {
    console.error('Error checking storage permission:', error);
    return false;
  }
};

/**
 * Request internet permission (usually granted automatically on Android 9+)
 */
export const checkInternetPermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return true;
    }
    // Internet permission is typically granted by default
    // but can be checked if using native modules
    return true;
  } catch (error) {
    console.error('Error checking internet permission:', error);
    return false;
  }
};

/**
 * Request multiple permissions at once and handle results
 */
export const requestRequiredPermissions = async () => {
  try {
    if (Platform.OS === 'web') {
      return {
        camera: true,
        storage: true,
        internet: true,
        allGranted: true,
      };
    }

    const cameraResult = await requestCameraPermission();
    const storageResult = await requestStoragePermission();
    const internetOk = await checkInternetPermission();

    const allGranted =
      cameraResult.status === 'granted' &&
      storageResult.status === 'granted' &&
      internetOk;

    return {
      camera: cameraResult.status === 'granted',
      storage: storageResult.status === 'granted',
      internet: internetOk,
      allGranted,
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return {
      camera: false,
      storage: false,
      internet: false,
      allGranted: false,
    };
  }
};

/**
 * Save CSV file to device storage (Downloads or Camera Roll)
 */
export const saveCSVToDevice = async (csvContent, filename) => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        message: 'Download not supported on web. Use browser download instead.',
      };
    }

    // Save to app's document directory first
    const docPath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(docPath, csvContent, {
      encoding: 'utf8',
    });

    // Android: use SAF folder picker to let user choose Downloads or any folder.
    if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
      try {
        const directoryPermission =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (directoryPermission.granted) {
          const base64Data = await FileSystem.readAsStringAsync(docPath, {
            encoding: 'base64',
          });

          const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
            directoryPermission.directoryUri,
            filename,
            'application/vnd.ms-excel'
          );

          await FileSystem.writeAsStringAsync(targetUri, base64Data, {
            encoding: 'base64',
          });

          return {
            success: true,
            message: 'Excel saved successfully. Choose your Downloads folder in the picker if needed.',
            filePath: targetUri,
          };
        }
      } catch (safError) {
        console.warn('SAF save failed, falling back to app file:', safError);
      }
    }

    return {
      success: true,
      message: `Excel file prepared: ${filename}`,
      filePath: docPath,
    };
  } catch (error) {
    console.error('Error saving CSV to device:', error);
    return {
      success: false,
      message: error.message || 'Failed to save CSV to device',
      error,
    };
  }
};

/**
 * Show permission request dialog with explanation
 */
export const showPermissionDialog = (permissionName, onAllow, onDeny) => {
  const messages = {
    camera: 'Camera access is needed to scan barcodes in the Products screen.',
    storage: 'Storage access is needed to download and backup CSV files to your device.',
    internet: 'Internet access is needed to sync your data with Firebase cloud.',
    all: 'The following permissions are needed:\n• Camera for barcode scanning\n• Storage for data backup\n• Internet for cloud sync',
  };

  Alert.alert(
    'Permission Required',
    messages[permissionName] || messages.all,
    [
      {
        text: 'Deny',
        onPress: onDeny || (() => {}),
        style: 'cancel',
      },
      {
        text: 'Allow',
        onPress: onAllow || (() => {}),
      },
    ],
    { cancelable: false }
  );
};

/**
 * Get permission status text
 */
export const getPermissionStatusText = (permission) => {
  const status = {
    camera: 'Camera',
    storage: 'Storage',
    internet: 'Internet',
  };
  return status[permission] || permission;
};
