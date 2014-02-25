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
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaResourceApi;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;

import com.polyvi.xface.util.XAssetsFileUtils;
import com.polyvi.xface.util.XConstant;
import com.polyvi.xface.util.XFileUtils;
import com.polyvi.xface.util.XLog;
import com.polyvi.xface.util.XPathResolver;
import com.polyvi.xface.util.XStringUtils;
import com.polyvi.xface.view.XAppWebView;

import android.content.Context;
import android.net.Uri;

public class XZipExt extends CordovaPlugin {
    private enum ErrorCode {
        NONE, FILE_NOT_EXIST, // 文件不存在
        COMPRESS_FILE_ERROR, // 压缩文件出错
        UNZIP_FILE_ERROR, // 解压文件出错
        FILE_PATH_ERROR, // 文件路径错误
        FILE_TYPE_ERROR, // 文件类型错误,不支持的文件类型
        UNKNOWN_ERR, // 未知错误
    }

    private static final String CLASS_NAME = XZipExt.class.getSimpleName();
    private static final String COMMAND_ZIP = "zip";
    private static final String COMMAND_ZIP_FILES = "zipFiles";
    private static final String COMMAND_UNZIP = "unzip";
    private CordovaResourceApi mResourceApi;
    private Context mContext;

    private interface ZipOp {
        void run() throws Exception;
    }

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        mContext = cordova.getActivity();
        super.initialize(cordova, webView);
    }

    @Override
    public boolean execute(final String action, final JSONArray args,
            final CallbackContext callbackContext) throws JSONException {
        mResourceApi = webView.getResourceApi();
        if (COMMAND_ZIP.equals(action)) {
            threadHelper(new ZipOp() {

                @Override
                public void run() throws Exception {
                    zipDir(args.getString(0), args.getString(1));
                }
            }, callbackContext, action);
        } else if (COMMAND_ZIP_FILES.equals(action)) {
            threadHelper(new ZipOp() {

                @Override
                public void run() throws Exception {
                    zipFiles(args.getJSONArray(0), args.getString(1));
                }
            }, callbackContext, action);
        } else if (COMMAND_UNZIP.equals(action)) {
            threadHelper(new ZipOp() {

                @Override
                public void run() throws Exception {
                    unzip(args.getString(0), args.getString(1));
                }
            }, callbackContext, action);
        }
        return true;
    }

    /**
     * 异步执行扩展功能，并处理结果
     *
     * @param zipOp
     * @param callbackContext
     * @param action
     */
    private void threadHelper(final ZipOp zipOp,
            final CallbackContext callbackContext, final String action) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    zipOp.run();
                    callbackContext.success();
                } catch (Exception e) {
                    XLog.e(CLASS_NAME, e.getMessage());
                    e.printStackTrace();
                    if (e instanceof IllegalArgumentException) {
                        callbackContext.error(ErrorCode.FILE_PATH_ERROR
                                .ordinal());
                    } else if (e instanceof FileNotFoundException) {
                        callbackContext.error(ErrorCode.FILE_NOT_EXIST
                                .ordinal());
                    } else if (e instanceof IOException) {
                        if (COMMAND_UNZIP.equals(action)) {
                            callbackContext.error(ErrorCode.UNZIP_FILE_ERROR
                                    .ordinal());
                        } else {
                            callbackContext.error(ErrorCode.COMPRESS_FILE_ERROR
                                    .ordinal());
                        }
                    } else {
                        callbackContext.error(ErrorCode.UNKNOWN_ERR.ordinal());
                    }
                }
            }
        });
    }

    /**
     * 获取应用程序工作空间的绝对路径
     *
     * @return 工作空间的绝对路径
     */
    private String getWorkspacePath() {
        XAppWebView xAppWebView = (XAppWebView) this.webView;
        return xAppWebView.getOwnerApp().getWorkSpace();
    }

    /**
     * 检查Uri可能包含非法字符
     *
     * @param fileAbsPath
     * @return true: 文件路径中包含非法字符，false: 文件路径正确
     */
    private boolean isFileUriValid(Uri fileUri) {
        return XFileUtils.isFilePathValid(fileUri.getPath());
    }

    /**
     * 检查2个文件（不是文件夹）是否相同
     *
     * @param srcFileUri
     *            原文件uri
     * @param targetUri
     *            待检查的文件uri
     * @return true: 相同，false: 不相同
     */
    private boolean areFilesSame(Uri srcFileUri, Uri targetUri) {
        return srcFileUri.equals(targetUri);
    }

    /**
     * 获取文件的uri
     *
     * @param filePath
     *            文件（夹）的URL或者相对于应用程序工作空间的相对路径
     * @return 文件（夹）的绝对路径
     */
    private Uri getFileUri(String filePath) throws IllegalArgumentException {
        if (XStringUtils.isEmptyString(filePath)) {
            throw new IllegalArgumentException();
        }
        Uri fileUri = new XPathResolver(filePath, getWorkspacePath())
                .getUri(this.webView.getResourceApi());
        if (!isFileUriValid(fileUri)) {
            throw new IllegalArgumentException();
        }
        return fileUri;
    }

    /**
     * 本方法是单个文件或文件夹进行压缩
     *
     * @param srcFileURL
     *            待压缩文件或者文件夹的URL
     * @param zipFileURL
     *            压缩后的zip文件名的URL
     * @throws FileNotFoundException
     * @throws IOException
     * @throws IllegalArgumentException
     */
    private void zipDir(String srcFileURL, String zipFileURL)
            throws FileNotFoundException, IOException, IllegalArgumentException {
        Uri srcFileUri = getFileUri(srcFileURL);
        Uri dstFileUri = getFileUri(zipFileURL);

        if (areFilesSame(srcFileUri, dstFileUri)) {
            throw new IllegalArgumentException();
        }
        prepareForZipDir(dstFileUri);

        ZipOutputStream zos = new ZipOutputStream(
                mResourceApi.openOutputStream(dstFileUri));
        compressDir(srcFileUri, zos, "");
        zos.close();
    }

    /**
     * 压缩前准备工作，如果zip文件传入的是相对路径，则需要创建文件的父目录
     *
     * @param dstFileUri
     */
    private void prepareForZipDir(Uri dstFileUri) {
        File zipFile = new File(dstFileUri.getPath());
        if (zipFile.exists()) {
            zipFile.delete();
        }
        File zipFileParent = zipFile.getParentFile();
        if (!zipFileParent.exists()) {
            zipFileParent.mkdirs();
        }
    }

    /**
     * 压缩文件或文件夹
     *
     * @param srcFileUri
     * @param zos
     * @param entry
     * @throws IOException
     * @throws IllegalArgumentException
     */
    private void compressDir(Uri srcFileUri, ZipOutputStream zos, String entry)
            throws IOException, IllegalArgumentException {
        if (null == zos) {
            XLog.e(CLASS_NAME, "Method compressDir: param is null!");
            throw new IllegalArgumentException();
        }
        if (srcFileUri.getPath().startsWith(XConstant.ANDROID_ASSET)) {
            compressAssetsFile(srcFileUri, zos, entry);
        } else {
            compressNormalFile(srcFileUri, zos, entry);
        }
    }

    /**
     * 压缩assets下的文件或文件夹
     *
     * @param srcFileUri
     * @param zos
     * @param entry
     * @throws IOException
     */
    private void compressAssetsFile(Uri srcFileUri, ZipOutputStream zos,
            String entry) throws IOException {
        String srcPath = srcFileUri.getPath().substring(
                XConstant.ANDROID_ASSET.length());
        if (XAssetsFileUtils.isFile(mContext, srcPath)) {
            zipFile(srcFileUri, zos, entry + srcFileUri.getLastPathSegment());
        } else {
            String childrens[] = mContext.getAssets().list(srcPath);
            Uri srcRootUri = srcFileUri;
            for (int index = 0; index < childrens.length; index++) {
                srcFileUri = Uri.parse(srcRootUri.toString() + File.separator
                        + childrens[index]);
                if (XAssetsFileUtils.isFile(mContext, srcPath + File.separator
                        + childrens[index])) {
                    zipFile(srcFileUri, zos, entry + childrens[index]);
                } else {
                    compressAssetsFile(srcFileUri, zos, entry
                            + childrens[index] + File.separator);
                }
            }
        }
    }

    /**
     * 压缩非assets下的文件或文件夹
     *
     * @param srcFileUri
     * @param zos
     * @param entry
     * @throws IOException
     * @throws FileNotFoundException
     */
    private void compressNormalFile(Uri srcFileUri, ZipOutputStream zos,
            String entry) throws IOException, FileNotFoundException {
        File srcFile = new File(srcFileUri.getPath());
        String[] dirList = srcFile.list();
        if ((null == dirList || 1 > dirList.length) && srcFile.isFile()) {
            // 处理单文件
            zipFile(srcFileUri, zos, srcFile.getName());
        } else {
            // 处理文件夹
            String srcRootPath = srcFileUri.toString();
            String srcFilePath = null;
            for (String pathName : dirList) {
                srcFilePath = srcRootPath + File.separator + pathName;
                srcFileUri = Uri.parse(srcFilePath);
                File f = new File(srcFileUri.getPath());
                if (f.isDirectory()) {
                    compressNormalFile(srcFileUri, zos, entry + f.getName()
                            + File.separator);
                    continue;
                }
                zipFile(srcFileUri, zos, entry + f.getName());
            }
        }
    }

    /**
     * 压缩单个文件
     *
     * @param srcFileUri
     * @param zos
     * @param zipEntryPath
     * @throws IOException
     */
    private void zipFile(Uri srcFileUri, ZipOutputStream zos,
            String zipEntryPath) throws IOException {
        InputStream srcIs = mResourceApi.openForRead(srcFileUri).inputStream;
        ZipEntry zipEntry = new ZipEntry(zipEntryPath);
        zos.putNextEntry(zipEntry);
        writeToZip(srcIs, zos);
    }

    /**
     * 将输入流压缩成zip文件
     *
     * @param srcIs
     * @param zos
     * @throws IOException
     * @throws IllegalArgumentException
     */
    private void writeToZip(InputStream srcIs, ZipOutputStream zos)
            throws IOException, IllegalArgumentException {
        if (null == srcIs || null == zos) {
            XLog.e(CLASS_NAME, "Method writeToZip: param is null!");
            throw new IllegalArgumentException();
        }
        try {
            byte[] readBuffer = new byte[XConstant.BUFFER_LEN];
            int bytesIn = 0;
            bytesIn = srcIs.read(readBuffer);
            while (bytesIn != -1) {
                zos.write(readBuffer, 0, bytesIn);
                bytesIn = srcIs.read(readBuffer);
            }
        } catch (IOException e) {
            XLog.e(CLASS_NAME, "Zip file failed!");
            throw new IOException();
        } finally {
            srcIs.close();
            zos.closeEntry();
        }
    }

    /**
     * 压缩多个可选文件方法
     *
     * @param srcEntries
     *            要压缩的源文件列表，可以是文件也可以是文件夹
     * @param destZipFile
     *            压缩成的目标文件，可以是test.zip也可以是a/b/c/test.zip
     * @return 压缩是否成功
     * @throws FileNotFoundException
     * @throws IOException
     * @throws IllegalArgumentException
     * @throws JSONException
     */
    private void zipFiles(JSONArray srcEntries, String destZipFile)
            throws FileNotFoundException, IOException,
            IllegalArgumentException, JSONException {
        Uri destFileUri = getFileUri(destZipFile);
        prepareForZipDir(destFileUri);

        ZipOutputStream zos = new ZipOutputStream(
                mResourceApi.openOutputStream(destFileUri));
        Uri[] paths = new Uri[srcEntries.length()];
        String path = null;
        for (int i = 0; i < srcEntries.length(); i++) {
            path = srcEntries.getString(i);
            paths[i] = getFileUri(path);
            compressDir(paths[i], zos, "");
        }
        zos.close();
    }

    /**
     * unzip解压缩方法
     *
     * @param zipFileURL
     *            待解压文件（zip文件）的相对路径或URL
     * @param destFileURL
     *            解压位置的相对路径或URL，如果为空，则解压到Workspace下
     * @return 解压缩是否成功
     * @throws FileNotFoundException
     * @throws IOException
     * @throws IllegalArgumentException
     */
    private void unzip(String zipFileURL, String destFileURL)
            throws FileNotFoundException, IOException, IllegalArgumentException {
        Uri zipFileUri = getFileUri(zipFileURL);
        Uri dstFileUri = getFileUri(destFileURL);
        InputStream is = mResourceApi.openForRead(zipFileUri).inputStream;
        unzipFileFromStream(dstFileUri, is);
    }

    /**
     * 从输入流中读取zip文件数据进行解压
     *
     * @param dstFileUri
     *            解压的目标路径
     * @param is
     *            源zip包输入流
     * @return 解压是否成功
     * @throws IOException
     * @throws FileNotFoundException
     * @throws IllegalArgumentException
     */
    private void unzipFileFromStream(Uri dstFileUri, InputStream is)
            throws IOException, FileNotFoundException, IllegalArgumentException {
        if (null == dstFileUri || null == is) {
            XLog.e(CLASS_NAME, "Method unzipFileFromStream: params is null");
            throw new IllegalArgumentException();
        }
        ZipInputStream zis = new ZipInputStream(is);
        ZipEntry entry = null;
        Uri unZipUri = null;
        while (null != (entry = zis.getNextEntry())) {
            File unZipFile = new File(dstFileUri.getPath() + File.separator
                    + entry.getName());
            unZipUri = Uri.fromFile(unZipFile);
            if (entry.isDirectory()) {
                if (!unZipFile.exists()) {
                    unZipFile.mkdirs();
                }
            } else {
                // 如果要解压的文件目标位置父目录不存在，创建对应目录
                prepareForZipDir(unZipUri);
                OutputStream fos = mResourceApi.openOutputStream(unZipUri);
                int readLen = 0;
                byte buffer[] = new byte[XConstant.BUFFER_LEN];
                while (-1 != (readLen = zis.read(buffer))) {
                    fos.write(buffer, 0, readLen);
                }
                fos.close();
            }
        }
        zis.close();
        is.close();
    }
}
