using System;
using System.IO;
using System.Diagnostics;
using Windows.Storage;
using ICSharpCode.SharpZipLib.Zip;

namespace WPCordovaClassLib.Cordova.Commands
{

    public class Zip : BaseCommand
    {
        private enum ErrorCode
        {
            NONE,
            // 文件不存在.
            FILE_NOT_EXIST,
            // 压缩文件出错.
            COMPRESS_FILE_ERROR,
            // 解压文件出错.
            UNZIP_FILE_ERROR,
            // 文件路径错误
            FILE_PATH_ERROR,
            // 文件类型错误,不支持的文件类型
            FILE_TYPE_ERROR,
        }

        public void zip(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            try
            {
                string srcFile = args[0];
                string destZipFile = args[1];
                if (string.IsNullOrEmpty(srcFile) || destZipFile == null)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_PATH_ERROR));
                    return;
                }
                String abssrcFile = BuildabsPathOnIsolatedStorage(srcFile);
                String absdestZipFile = BuildabsPathOnIsolatedStorage(destZipFile);
                bool isFileExist = System.IO.File.Exists(abssrcFile);
                bool isDirExist = Directory.Exists(abssrcFile);
                if (!isFileExist && !isDirExist)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_NOT_EXIST));
                    return;
                }
                bool flag = ZipLibrary.Zip.ZipFile(abssrcFile, absdestZipFile);
                isFileExist = System.IO.File.Exists(absdestZipFile);
                if (!flag || !isFileExist)
                {
                    Debug.WriteLine("zip:" + srcFile + "To path:" + destZipFile + " fail");
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.COMPRESS_FILE_ERROR));
                }
                else
                {
                    Debug.WriteLine("zip:" + srcFile + "To path:" + destZipFile + " success");
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine("zip exception :: " + ex.Message);
                if (ex is ArgumentException || ex is IOException || ex is ZipException)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.COMPRESS_FILE_ERROR));
                    return;
                }
                throw ex;
            }

        }

        public void zipFiles(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            string[] paths = JSON.JsonHelper.Deserialize<string[]>(args[0]);
            if (paths == null)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_NOT_EXIST));
                return;
            }

            string destZipFile = args[1];
            String absdestZipFile = BuildabsPathOnIsolatedStorage(destZipFile);
            string[] abspaths = new string[paths.Length];
            for (int i = 0; i < paths.Length; i++)
            {
                if (string.IsNullOrEmpty(paths[i]))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_PATH_ERROR));
                    return;
                }
                abspaths[i] = BuildabsPathOnIsolatedStorage(paths[i]);
                bool isFileExist = System.IO.File.Exists(abspaths[i]);
                bool isDirExist = Directory.Exists(abspaths[i]);
                if (!isFileExist && !isDirExist)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_NOT_EXIST));
                    return;
                }
            }

            try
            {
                bool flag = ZipLibrary.Zip.ZipFiles(abspaths, absdestZipFile);
                if (!flag)
                {
                    Debug.WriteLine("zipFiles fail");
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.COMPRESS_FILE_ERROR));
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine("zipFiles exception :: " + ex.Message);
                if (ex is ArgumentException || ex is IOException || ex is ZipException)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.COMPRESS_FILE_ERROR));
                    return;
                }
                throw ex;
            }
        }

        public void unzip(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            try
            {
                string zipFilePath = args[0];
                string destPath = args[1];
                if (string.IsNullOrEmpty(zipFilePath) || destPath == null)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_PATH_ERROR));
                    return;
                }
                String abssrcFile = BuildabsPathOnIsolatedStorage(zipFilePath);
                String absdestPath = BuildabsPathOnIsolatedStorage(destPath);
                bool isFileExist = System.IO.File.Exists(abssrcFile);
                if (!isFileExist)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_NOT_EXIST));
                    return;
                }
                bool flag = ZipLibrary.Zip.unZipFile(abssrcFile, absdestPath);
                if (!flag)
                {
                    Debug.WriteLine("unzip:" + zipFilePath + "To path:" + destPath + " fail");
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.UNZIP_FILE_ERROR));
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                }

            }
            catch (Exception ex)
            {
                Debug.WriteLine("unzip exception :: " + ex.Message);
                if (ex is ArgumentException || ex is IOException || ex is ZipException)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.UNZIP_FILE_ERROR));
                    return;
                }
                throw ex;
            }
        }

        /// <summary>
        /// 将独立存储上文件的相对路径转为绝对路径
        /// 形如： xFace
        /// 返回： C:\Data\Users\DefApps\AppData\{productId}\Local\xFace\
        /// </summary>
        /// <param name="relativePath">独立存储上文件的相对独立存储的相对路径</param>
        /// <returns>返回绝对路径</returns>
        private string BuildabsPathOnIsolatedStorage(string relativePath)
        {
            //localFolder fullPath 形如 C:\Data\Users\DefApps\AppData\{productId}\Local\
            StorageFolder localFolder = Windows.Storage.ApplicationData.Current.LocalFolder;
            string localFolderPath = localFolder.Path;
            string fullPath = localFolderPath + "\\" + relativePath;
            return fullPath;
        }

    }
}