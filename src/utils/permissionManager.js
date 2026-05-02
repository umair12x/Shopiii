import { requestPermissionsAsync, getPermissionsAsync } from 'expo-camera';
import { 
  getMediaLibraryPermissionsAsync, 
  requestMediaLibraryPermissionsAsync,
  saveToLibraryAsync 
} from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';

/**
 * Request camera permission
 */
export const requestCameraPermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return { status: 'granted' }; // Web doesn't need explicit permissions
    }
    
    const result = await requestPermissionsAsync();
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
    
    const result = await getPermissionsAsync();
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

    // First check current status
    const current = await getMediaLibraryPermissionsAsync();
    
    // If already granted or web, return
    if (current.status === 'granted') {
      return current;
    }

    // Request permission - this will show native permission dialog
    const result = await requestMediaLibraryPermissionsAsync();
    return result;
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

    const result = await getMediaLibraryPermissionsAsync();
    return result.status === 'granted';
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

    // First, check and request storage permission
    const permission = await requestStoragePermission();
    if (permission.status !== 'granted') {
      return {
        success: false,
        message: 'Storage permission was denied. Cannot save file.',
      };
    }

    // Save to app's document directory first
    const docPath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(docPath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Try to save to device library (Camera Roll/Downloads)
    try {
      if (Platform.OS === 'ios') {
        // On iOS, save to camera roll
        await saveToLibraryAsync(docPath);
      } else if (Platform.OS === 'android') {
        // On Android, also try to save to library
        await saveToLibraryAsync(docPath);
      }
    } catch (libraryError) {
      console.warn('Could not save to device library:', libraryError);
      // Continue - file is saved in app directory at least
    }

    return {
      success: true,
      message: `CSV downloaded to device storage: ${filename}`,
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
