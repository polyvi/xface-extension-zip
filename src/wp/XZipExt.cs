﻿using System;
using System.IO;
using ICSharpCode.SharpZipLib.Zip;
using xFaceLib.runtime;
using xFaceLib.Util;
using xFaceLib.Log;

namespace WPCordovaClassLib.Cordova.Commands
{

    public class Zip : XBaseCommand
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
                string workspace = this.app.GetWorkSpace();
                string srcFile = XUtils.ResolvePath(workspace, args[0]);
                string destZipFile = XUtils.ResolvePath(workspace, args[1]);
                if (string.IsNullOrEmpty(srcFile) || string.IsNullOrEmpty(destZipFile)
                    || srcFile.Equals(workspace))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_PATH_ERROR));
                    return;
                }
                String abssrcFile = XUtils.BuildabsPathOnIsolatedStorage(srcFile);
                String absdestZipFile = XUtils.BuildabsPathOnIsolatedStorage(destZipFile);
                bool isFileExist = System.IO.File.Exists(abssrcFile);
                bool isDirExist = Directory.Exists(abssrcFile);
                if (!isFileExist && !isDirExist)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_NOT_EXIST));
                    return;
                }
                bool flag = XUtils.ZipFile(abssrcFile, absdestZipFile);
                isFileExist = System.IO.File.Exists(absdestZipFile);
                if (!flag || !isFileExist)
                {
                    XLog.WriteError("zip:" + srcFile + "To path:" + destZipFile + " fail");
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.COMPRESS_FILE_ERROR));
                }
                else
                {
                    XLog.WriteInfo("zip:" + srcFile + "To path:" + destZipFile + " success");
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                }
            }
            catch (Exception ex)
            {
                XLog.WriteError("zip exception :: " + ex.Message);
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
            string workspace = this.app.GetWorkSpace();
            string destZipFile = XUtils.ResolvePath(workspace, args[1]);
            if (null == destZipFile)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_PATH_ERROR));
                return;
            }
            string absdestZipFile = XUtils.BuildabsPathOnIsolatedStorage(destZipFile);
            string[] abspaths = new string[paths.Length];
            for (int i = 0; i < paths.Length; i++)
            {
                abspaths[i] = XUtils.ResolvePath(workspace, paths[i]);
                if (string.IsNullOrEmpty(abspaths[i]))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_PATH_ERROR));
                    return;
                }
                abspaths[i] = XUtils.BuildabsPathOnIsolatedStorage(abspaths[i]);
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
                bool flag = XUtils.ZipFiles(abspaths, absdestZipFile);
                if (!flag)
                {
                    XLog.WriteError("zipFiles fail");
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.COMPRESS_FILE_ERROR));
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                }
            }
            catch (Exception ex)
            {
                XLog.WriteError("zipFiles exception :: " + ex.Message);
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
                string workspace = this.app.GetWorkSpace();
                string zipFilePath = XUtils.ResolvePath(workspace, args[0]);
                string destPath = XUtils.ResolvePath(workspace, args[1]);
                if (string.IsNullOrEmpty(zipFilePath) || destPath == null)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_PATH_ERROR));
                    return;
                }
                String abssrcFile = XUtils.BuildabsPathOnIsolatedStorage(zipFilePath);
                String absdestPath = XUtils.BuildabsPathOnIsolatedStorage(destPath);
                bool isFileExist = System.IO.File.Exists(abssrcFile);
                if (!isFileExist)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.FILE_NOT_EXIST));
                    return;
                }
                bool flag = XUtils.unZipFile(abssrcFile, absdestPath);
                if (!flag)
                {
                    XLog.WriteError("unzip:" + zipFilePath + "To path:" + destPath + " fail");
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.UNZIP_FILE_ERROR));
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                }

            }
            catch (Exception ex)
            {
                XLog.WriteError("unzip exception :: " + ex.Message);
                if (ex is ArgumentException || ex is IOException || ex is ZipException)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ErrorCode.UNZIP_FILE_ERROR));
                    return;
                }
                throw ex;
            }
        }
    }
}