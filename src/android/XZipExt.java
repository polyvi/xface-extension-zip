/*
 Copyright 2012-2013, Polyvi Inc. (http://polyvi.github.io/openxface)
 This program is distributed under the terms of the GNU General Public License.

 This file is part of xFace.

 xFace is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 xFace is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with xFace.  If not, see <http://www.gnu.org/licenses/>.
 */

package com.polyvi.xface.extension.zip;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import com.polyvi.xface.util.XFileUtils;
import com.polyvi.xface.util.XPathResolver;
import com.polyvi.xface.view.XAppWebView;

import android.util.Log;

public class XZipExt extends CordovaPlugin {
    private enum ErrorCode {
        NONE,
        FILE_NOT_EXIST,      // 文件不存在
        COMPRESS_FILE_ERROR, // 压缩文件出错
        UNZIP_FILE_ERROR,    // 解压文件出错
        FILE_PATH_ERROR,     // 文件路径错误
        FILE_TYPE_ERROR,     // 文件类型错误,不支持的文件类型
    }

    private static final String COMMAND_ZIP = "zip";
    private static final String COMMAND_ZIP_FILES = "zipFiles";
    private static final String COMMAND_UNZIP = "unzip";
    private final int BUFFER_LEN = 2048;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext)
            throws JSONException {
        ErrorCode code = ErrorCode.NONE;
        if (COMMAND_ZIP.equals(action)) {
            try {
                boolean zipSuccess = zip(args.getString(0), args.getString(1));
                if (!zipSuccess) {
                    code = ErrorCode.FILE_PATH_ERROR;
                } else {
                    callbackContext.success();
                }
            } catch (FileNotFoundException e) {
                code = ErrorCode.FILE_NOT_EXIST;
            } catch (IOException e) {
                code = ErrorCode.COMPRESS_FILE_ERROR;
            } catch (IllegalArgumentException e) {
                code = ErrorCode.FILE_PATH_ERROR;
            }
        } else if (COMMAND_ZIP_FILES.equals(action)) {
            try {
                boolean zipSuccess = zipFiles(args.getJSONArray(0), args.getString(1));
                if (!zipSuccess) {
                    code = ErrorCode.FILE_PATH_ERROR;
                } else {
                    callbackContext.success();
                }
            } catch (FileNotFoundException e) {
                code = ErrorCode.FILE_NOT_EXIST;
            } catch (IOException e) {
                code = ErrorCode.COMPRESS_FILE_ERROR;
            } catch (IllegalArgumentException e) {
                code = ErrorCode.FILE_PATH_ERROR;
            }
        } else if (COMMAND_UNZIP.equals(action)) {
            try {
                boolean zipSuccess = unzip(args.getString(0), args.getString(1));
                if (!zipSuccess) {
                    code = ErrorCode.FILE_PATH_ERROR;
                } else {
                    callbackContext.success();
                }
            } catch (FileNotFoundException e) {
                code = ErrorCode.FILE_NOT_EXIST;
            } catch (IOException e) {
                code = ErrorCode.COMPRESS_FILE_ERROR;
            } catch (IllegalArgumentException e) {
                code = ErrorCode.FILE_PATH_ERROR;
            }
        }
        callbackContext.error(code.ordinal());
        return true;
    }

    /**
     * 获取应用程序工作空间的绝对路径
     *
     * @return 工作空间的绝对路径
     */
    private String getWorkspacePath(){
        XAppWebView xAppWebView = (XAppWebView) webView;
        return xAppWebView.getOwnerApp().getWorkSpace();
    }

    /**
     * 检查文件路径所对应的文件或者文件夹是否存在
     *
     * @param fileAbsPath  文件或者文件夹的绝对路径
     * @return true: 文件或文件夹存在，false：文件或文件夹不存在
     */
    private boolean isFileOrFolderExist(String fileAbsPath) {
        return new File(fileAbsPath).exists();
    }

    /**
     * 删除文件或者文件夹
     *
     * @param fileAbsPath
     */
    private void deleteFileOrFolder(String fileAbsPath){
        File f = new File(fileAbsPath);
        if(f.exists()){
            f.delete();
        }
    }

    /**
     * 判断字符串是否是空
     * @param str 待判断的字符串
     * @return 若字符串值是null或"",则返回true, 否则返回false
     */
    private boolean isEmptyString(String str){
        return (null == str)||(str.length() < 1);
    }

    /**
     * 创建压缩后文件的父目录，如果在JS端传入的是相对路径，而不仅仅是文件名称，则需要创建文件的父目录
     * @param zipFileAbsPath 文件的绝对路径
     * @return
     */
    private boolean createZipFileParent(String zipFileAbsPath){
        File zipFile = new File(zipFileAbsPath);
        File zipFileParent = zipFile.getParentFile();
        if (!zipFileParent.exists()) {
            zipFileParent.mkdirs();
        }
        return true;
    }
    /**
     * 检查文件路径是否有错，文件路径中可能包含非法字符
     * @param fileAbsPath
     * @return true: 文件路径中包含非法字符，false: 文件路径正确
     */
    private boolean isFileOrFolderAbsPathError(String fileAbsPath){
        return (null == fileAbsPath)||!XFileUtils.isFileAncestorOf(getWorkspacePath(), fileAbsPath);
    }

    /**
     * 检查2个文件（不是文件夹）是否相同
     * @param srcFileAbsPath 原文件
     * @param targetFileAbsPath 待检查的文件
     * @return true: 相同，false: 不相同
     */
    private boolean areTwoFilesTheSame(String srcFileAbsPath,String targetFileAbsPath){
        return (new File(srcFileAbsPath)).isFile()&&srcFileAbsPath.equals(targetFileAbsPath);
    }

    /**
     * 根据文件（夹）的名字或者相对于应用程序工作空间的相对路径获得该文件（夹）的绝对路径
     *
     * @param filename 文件（夹）的名字或者相对于应用程序工作空间的相对路径
     * @return 文件（夹）的绝对路径
     */
    private String getAbsoluteFilePath(String filenameOrRelativePath){
        return new XPathResolver(filenameOrRelativePath, getWorkspacePath(), null).resolve();
    }

    /**
     * zip压缩
     *
     * @param srcEntry  要压缩的源文件或文件夹绝对路径
     * @param destZipFile  压缩成的目标文件的绝对路径
     * @return  压缩是否成功
     * @throws NullPointerException, FileNotFoundException, IOException, IllegalArgumentException
     * */
    private boolean zip(String srcEntry, String destZipFile)
            throws NullPointerException, FileNotFoundException, IOException, IllegalArgumentException {
        zipDir(srcEntry, destZipFile);
        return true;
    }

    /**
     * 对文件或文件夹进行压缩
     *
     * @param srcFilePath   待压缩文件或者文件夹的相对路径
     * @param zipFileName   压缩后的zip文件名的相对路径
     * @throws NullPointerException, FileNotFoundException,
     *         IOException, IllegalArgumentException
     */
    private void zipDir(String srcFilePath, String zipFileName)
            throws NullPointerException, FileNotFoundException,
                   IOException, IllegalArgumentException {

        // 本方法是对单个文件进行压缩，需要确保原文件名和压缩后的文件名都不为空
        if (isEmptyString(srcFilePath) || isEmptyString(zipFileName)) {
            throw new IllegalArgumentException();
        }

        // 获取待压缩、压缩后的文件绝对路径
        String srcFileAbsPath = getAbsoluteFilePath(srcFilePath);
        String dstFileAbsPath = getAbsoluteFilePath(zipFileName);

        // 检查文件名中是否包含非法字符
        if(isFileOrFolderAbsPathError(srcFileAbsPath) ||
           isFileOrFolderAbsPathError(dstFileAbsPath)){
            throw new IllegalArgumentException();
        }

        // 待压缩文件必须存在磁盘上
        if(!isFileOrFolderExist(srcFileAbsPath)){
            throw new FileNotFoundException();
        }

        // 若待压缩的文件是文件（不是文件夹）时，需要检查待压缩文件名和和压缩包文件名是否相同
        if (areTwoFilesTheSame(srcFileAbsPath, dstFileAbsPath)) {
            throw new IllegalArgumentException();
        }

        // 压缩后的文件（不是文件夹）在压缩前不应该存在
        if(isFileOrFolderExist(dstFileAbsPath)){
            deleteFileOrFolder(dstFileAbsPath);
        }

        // 如果zip文件传入的是相对路径，则需要创建文件的父目录
        createZipFileParent(dstFileAbsPath);

        // 各种可能的异常或错误检查完毕，下面进行文件压缩
        File srcFile = new File(srcFileAbsPath);
        File zipFile = new File(dstFileAbsPath);
        ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFile));
        String entryPath = "";
        if (srcFile.isDirectory()) {
            entryPath = srcFile.getName() + File.separator;
        }
        compressDir(srcFileAbsPath, zos, entryPath);
        zos.close();
    }

    /**
     * 压缩一个文件或者文件夹
     *
     * @param srcFilePath  带压缩的文件或文件夹
     * @param zos          zip输出流 {@link ZipOutputStream}
     * @param entryPath    要写入到zip文件中的文件或文件夹的路径
     * @throws IOException
     */
    private void compressDir(String srcFilePath, ZipOutputStream zos, String entryPath)
            throws IOException {
        File zipDir = new File(srcFilePath);
        String[] dirList = zipDir.list();
        if (null == dirList || 0 == dirList.length || zipDir.isFile()) {
            writeToZip(zipDir, zos, entryPath);
        } else {
            for (String pathName : dirList){
                File f = new File(zipDir, pathName);
                if (f.isDirectory()) {
                    String filePath = f.getPath();
                    compressDir(filePath, zos, entryPath + f.getName() + File.separator);
                    continue;
                }
                writeToZip(f, zos, entryPath);
            }
        }
    }

    /**
     * 将文件写入zip文件中
     *
     * @param zos        输出流
     * @param entryPath  要写入到zip文件中的文件或文件夹的路径
     * @throws IOException
     * */
    private void writeToZip(File srcFile, ZipOutputStream zos, String entryPath)
            throws IOException {
        ZipEntry anEntry = null;
        if (srcFile.isDirectory()) {
            anEntry = new ZipEntry(entryPath);
            zos.putNextEntry(anEntry);
            return;
        }
        anEntry = new ZipEntry(entryPath + srcFile.getName());
        zos.putNextEntry(anEntry);
        FileInputStream fis = new FileInputStream(srcFile);
        byte[] readBuffer = new byte[BUFFER_LEN];
        int bytesIn = 0;
        bytesIn = fis.read(readBuffer);
        while (bytesIn != -1) {
            zos.write(readBuffer, 0, bytesIn);
            bytesIn = fis.read(readBuffer);
        }
        fis.close();
        zos.closeEntry();
    }

    /**
     * 压缩多个可选文件方法
     *
     * @param srcEntries   要压缩的源文件列表，可以是文件也可以是文件夹
     * @param destZipFile  压缩成的目标文件，可以是test.zip也可以是a/b/c/test.zip
     * @return             压缩是否成功
     * @throws NullPointerException, FileNotFoundException, IOException, IllegalArgumentException,JSONException
     * */
    private boolean zipFiles(JSONArray srcEntries, String destZipFile)
            throws NullPointerException, FileNotFoundException, IOException, IllegalArgumentException,JSONException {

        // 本方法是对多个文件或者文件夹进行压缩，需要确保原文件名和压缩后的文件名都不为空
        if (isEmptyString(destZipFile)) {
            throw new IllegalArgumentException();
        }

        // 获取压缩后的文件绝对路径
        String srcFileAbsPath = getAbsoluteFilePath(destZipFile);

        // 检查压缩后的文件绝对路径中是否包含非法字符
        if(isFileOrFolderAbsPathError(srcFileAbsPath)){
            throw new IllegalArgumentException();
        }

        // 压缩后的文件（不是文件夹）在压缩前不应该存在
        if(isFileOrFolderExist(srcFileAbsPath)){
            deleteFileOrFolder(srcFileAbsPath);
        }

        // 如果zip文件传入的是相对路径，则需要创建文件的父目录
        createZipFileParent(srcFileAbsPath);

        String[] paths = new String[srcEntries.length()];
        String temp = "";
        for (int i = 0; i < srcEntries.length(); i++) {
            temp = srcEntries.getString(i);
            if (isEmptyString(temp)) {//每一个待压缩的文件都不能为空
                throw new IllegalArgumentException();
            }
            paths[i] = getAbsoluteFilePath(temp);//获取每个待压缩文件的绝对路径

            if(isFileOrFolderAbsPathError(paths[i])){//检查压缩后的文件绝对路径中是否包含非法字符
                throw new IllegalArgumentException();
            }

            if (!isFileOrFolderExist(paths[i])) {//每一个待压缩的文件都必须存在磁盘上
                throw new FileNotFoundException();
            }
        }

        zipFiles(paths, srcFileAbsPath);
        return true;
    }

    /**
     * 对多个目录或文件进行zip压缩
     *
     * @param srcFilePaths  待压缩的文件列表
     * @param zipFileName   要压缩成的zip文件名
     * @throws NullPointerException, FileNotFoundException, IOException, IllegalArgumentException
     */
    private void zipFiles(String[] srcFilePaths, String zipFileName)
            throws NullPointerException, FileNotFoundException, IOException, IllegalArgumentException {
        if (isEmptyString(zipFileName)) {
            throw new IllegalArgumentException();
        }

        for (String path:srcFilePaths) {
            if (isEmptyString(path)) {
                throw new IllegalArgumentException();
            }
            File srcFile = new File(path);
            if (!srcFile.exists()) {
                throw new FileNotFoundException();
            }
            //当要压缩的是一个文件时候，如果要压缩成的文件名和它同名，则抛出异常
            if (srcFile.isFile() && zipFileName.equals(path)) {
                throw new IllegalArgumentException();
            }
        }

        File zipFile = new File(zipFileName);
        File zipFileParent = zipFile.getParentFile();
        if (!zipFileParent.exists()) {
            zipFileParent.mkdirs();
        }

        ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFile));
        for (String path:srcFilePaths) {
            File entry = new File(path);
            String entryPath = "";
            if (entry.isDirectory()) {
                entryPath = entry.getName() + File.separator;
            }
            compressDir(path, zos, entryPath);
        }
        zos.close();
    }


    /**
     * unzip解压缩方法(都限定在app的workspace下面)
     *
     * @param zipFilePath       待解压文件（zip文件）的相对路径
     * @param destPath          解压位置的相对路径，如果为空，则解压到Workspace下
     * @return 解压缩是否成功
     * */
    private boolean unzip(String zipFilePath, String destPath)
            throws FileNotFoundException, IOException {

        // 本方法是对单个文件进行解压，只需要确保原文件名不为空，解压目的路径可以为空
        if (isEmptyString(zipFilePath)) {
            throw new IllegalArgumentException();
        }

        // 获取绝对路径
        String srcFileAbsPath = getAbsoluteFilePath(zipFilePath);
        String dstFileAbsPath = getAbsoluteFilePath(destPath);

        // 检查文件路径中是否包含非法字符
        if(isFileOrFolderAbsPathError(srcFileAbsPath) ||
           isFileOrFolderAbsPathError(dstFileAbsPath)){
            throw new IllegalArgumentException();
        }

        // 待解压的文件必须存在磁盘上
        if(!isFileOrFolderExist(srcFileAbsPath)){
            throw new FileNotFoundException();
        }

        unzipFile(dstFileAbsPath, srcFileAbsPath);
        return true;
    }

    /**
     * 解压zip文件
     *
     * @param targetPath   解压的目标路径
     * @param zipFilePath  zip包路径
     * @throws FileNotFoundException, IOException
     */
    private void unzipFile(String targetPath, String zipFilePath)
            throws FileNotFoundException, IOException {
        File zipFile = new File(zipFilePath);
        InputStream is = null;
        is = new FileInputStream(zipFile);
        if(!unzipFileFromStream(targetPath, is)) {
            throw new IOException();
        }
    }

    /**
     * 从输入流中读取zip文件数据进行解压
     *
     * @param targetPath  解压的目标路径
     * @param is          源zip包输入流
     * @return            解压是否成功
     * @throws IOException
     */
    private boolean unzipFileFromStream(String targetPath, InputStream is)
            throws IOException {
        File dirFile = new File(targetPath + File.separator);
        if (!dirFile.exists()) {
            dirFile.mkdirs();
        }

        ZipInputStream zis = new ZipInputStream(is);
        ZipEntry entry = null;
        while (null != (entry = zis.getNextEntry())) {
            String zipFileName = entry.getName();
            if (entry.isDirectory()) {
                File zipFolder = new File(targetPath + File.separator
                        + zipFileName);
                if (!zipFolder.exists()) {
                    zipFolder.mkdirs();
                }
            } else {
                File file = new File(targetPath + File.separator + zipFileName);

                // 如果要解压的文件目标位置父目录不存在，创建对应目录
                File parent = file.getParentFile();
                if (!parent.exists()) {
                    parent.mkdirs();
                }

                FileOutputStream fos = null;
                try {
                    fos = new FileOutputStream(file);
                } catch (FileNotFoundException e) {
                    Log.d("Zip", "Can't write file: " + file.getAbsolutePath());
                    e.printStackTrace();
                    return false;
                }
                int readLen = 0;
                byte buffer[] = new byte[BUFFER_LEN];
                while (-1 != (readLen = zis.read(buffer))) {
                    fos.write(buffer, 0, readLen);
                }
                fos.close();
            }
        }
        zis.close();
        is.close();
        return true;
    }
}
