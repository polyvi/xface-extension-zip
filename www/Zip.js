
/*
 Copyright 2012-2013, Polyvi Inc. (http://www.xface3.com)
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

/**
 * 该模块定义与压缩与解压缩相关的一些功能.
 * @module zip
 * @main zip
 */

/**
 * 该类定义了压缩与解压缩相关接口（Android, iOS, WP8）<br/>
 * 该类不能通过new来创建相应的对象，只能通过xFace.Zip对象来直接使用该类中定义的方法
 * 相关参考： {{#crossLink "ZipError"}}{{/crossLink}}
 * @class Zip
 * @static
 * @platform Android, iOS, WP8
 * @since 3.0.0
 */
var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec');
var ZipError = require('./ZipError');
var Zip = function() {};

/**
 * 将指定路径的文件或文件夹压缩成zip文件（Android, iOS, WP8）<br/>
 * 成功回调函数不带参数<br/>
 * 错误回调函数带有一个Number类型的参数，用于返回错误码，错误码的定义参见{{#crossLink "ZipError"}}{{/crossLink}}<br/>
 * @example
        var filePath ="MyFile.txt";
        var zipFilePath ="MyZip.zip";
        var zipFilePath2 ="mypath/MyZip.zip";
        function Success() {
                alert("zip file success" );
            }
        function Error(errorcode) {
                alert("zip file error: errorcode = " + errorcode);
            }

        xFace.Zip.zip(filePath, zipFilePath, Success, Error, {password:"test"}); //表明将文件压缩到当前目录，压缩文件的名字为MyZip.zip
        xFace.Zip.zip(filePath, zipFilePath2, Success, Error); //表明将文件压缩到当前目录的mypath文件夹下,压缩文件的名字为MyZip.zip
 * @method zip
 * @param {String} filePath 待压缩的文件路径<br/>
 *        文件路径支持的类型：<br/>
 *          1.相对路径，例如："myPath/test.txt"，则默认在app的workspace下<br/>
 *          2.全路径，例如："/myPath/..."<br/>
 *          3.file://协议URL，例如："file:///myPath/..."<br/>
 *          4.通过{{#crossLink "File"}}{{/crossLink}}扩展获取的URL，参见{{#crossLink "Entry/toURL"}}{{/crossLink}}
 * @param {String} dstFilePath 指定目标文件路径(含 .zip 后缀)
 *        文件路径支持的类型：<br/>
 *          1.相对路径，例如："myPath/test.zip"，则默认在app的workspace下<br/>
 *          2.全路径，例如："/myPath/..."<br/>
 *          3.file://协议URL，例如："file:///myPath/..."<br/>
 *          4.通过{{#crossLink "File"}}{{/crossLink}}扩展获取的URL，参见{{#crossLink "Entry/toURL"}}{{/crossLink}}
 * @param {Object} [options]     压缩文件时采用的配置选项（目前仅ios支持），属性包括：<br/>
        password：类型为String，用于指定压缩时的密码
 * @param {Function} [successCallback] 成功回调函数
 * @param {Function} [errorCallback]   失败回调函数
 * @platform Android, iOS, WP8
 * @since 3.0.0
 */
Zip.prototype.zip = function(filePath, dstFilePath, successCallback, errorCallback,options){
    argscheck.checkArgs('ssFFO', 'xFace.Zip.zip', arguments);
    if((filePath == "" ||  dstFilePath == "") && errorCallback){
        errorCallback(ZipError.FILE_NOT_EXIST);
        return;
    }
    exec(successCallback, errorCallback, "Zip", "zip", [filePath,dstFilePath,options]);
};

/**
 * 将指定路径的zip文件解压（Android, iOS, WP8）<br/>
 * 成功回调函数不带参数<br/>
 * 错误回调函数带有一个Number类型的参数，用于返回错误码，错误码的定义参见{{#crossLink "ZipError"}}{{/crossLink}}<br/>
 * @example
        var dstFolderPath = "MyDstFolder";
        var zipFilePath ="MyZip.zip";
        function Success() {
                alert("zip file success" );
            }
        function Error(errorcode) {
                alert("zip file error: errorcode = " + errorcode);
            }

        xFace.Zip.unzip(zipFilePath, dstFolderPath, Success, Error, {password:"test"});
 * @method unzip
 * @param {String} zipFilePath 待解压的指定路径的zip文件
 *        文件路径支持的类型：<br/>
 *          1.相对路径，例如："myPath/test.zip"，则默认在app的workspace下<br/>
 *          2.全路径，例如："/myPath/..."<br/>
 *          3.file://协议URL，例如："file:///myPath/..."<br/>
 *          4.通过{{#crossLink "File"}}{{/crossLink}}扩展获取的URL，参见{{#crossLink "Entry/toURL"}}{{/crossLink}}
 * @param {String} dstFolderPath 指定目标文件夹（如果为空串的话，就解压到当前app workspace目录；Android不支持路径为空）
 *        文件路径支持的类型：<br/>
 *          1.相对路径，例如："myPath/MyDstFolder"，则默认在app的workspace下<br/>
 *          2.全路径，例如："/myPath/..."<br/>
 *          3.file://协议URL，例如："file:///myPath/..."<br/>
 *          4.通过{{#crossLink "File"}}{{/crossLink}}扩展获取的URL，参见{{#crossLink "Entry/toURL"}}{{/crossLink}}
 * @param {Object} [options]  解压文件时采用的配置选项（目前仅ios支持），属性包括：<br/>
        password：类型为String，用于指定解压时的密码
 * @param {Function} [successCallback] 成功回调函数
 * @param {Function} [errorCallback]   失败回调函数
 * @platform Android, iOS, WP8
 * @since 3.0.0
 */
Zip.prototype.unzip = function(zipFilePath, dstFolderPath, successCallback, errorCallback,options){
    argscheck.checkArgs('ssFFO', 'xFace.Zip.unzip', arguments);
    if(zipFilePath == "" && errorCallback){
        errorCallback(ZipError.FILE_NOT_EXIST);
        return;
    }
    //zip文件类型检查（zip/xpa/xspa）
    var arr = zipFilePath.split(".");
    var suffix = arr[arr.length -1];
    console.log("file type: "+ suffix);
    if("zip" == suffix || "xpa" == suffix || "xspa" == suffix) {
        exec(successCallback, errorCallback, "Zip", "unzip", [zipFilePath,dstFolderPath,options]);
    }
    else {
        if( errorCallback && (typeof errorCallback == 'function') ) {
            errorCallback(ZipError.FILE_TYPE_ERROR);
        }
    }
};

/**
 * 将多个指定路径的文件或文件夹压缩成zip文件（Android, iOS, WP8）<br/>
 * 成功回调函数不带参数<br/>
 * 错误回调函数带有一个Number类型的参数，用于返回错误码，错误码的定义参见{{#crossLink "ZipError"}}{{/crossLink}}<br/>
 * @example
        var zipFilePath ="MyZip.zip";
        function Success() {
                alert("zip file success" );
            }
        function Error(errorcode) {
                alert("zip file error: errorcode = " + errorcode);
            }

        xFace.Zip.zipFiles(["MyZip", "test.apk", "index.html"],
                        zipFilePath, Success, Error, {password:"test"});
 * @method zipFiles
 * @param {Array} srcEntries  待压缩文件或文件夹的路径数组，String类型的Array
 *        文件路径支持的类型：<br/>
 *          1.相对路径，例如："myPath/test.txt"，则默认在app的workspace下<br/>
 *          2.全路径，例如："/myPath/..."<br/>
 *          3.file://协议URL，例如："file:///myPath/..."<br/>
 *          4.通过{{#crossLink "File"}}{{/crossLink}}扩展获取的URL，参见{{#crossLink "Entry/toURL"}}{{/crossLink}}
 * @param {String} dstFilePath  指定目标文件路径(含 .zip 后缀)
 *        文件路径支持的类型：<br/>
 *          1.相对路径，例如："myPath/test.zip"，则默认在app的workspace下<br/>
 *          2.全路径，例如："/myPath/..."<br/>
 *          3.file://协议URL，例如："file:///myPath/..."<br/>
 *          4.通过{{#crossLink "File"}}{{/crossLink}}扩展获取的URL，参见{{#crossLink "Entry/toURL"}}{{/crossLink}}
 * @param {Object} [options]      压缩文件时采用的配置选项（目前仅ios支持），属性包括：<br/>
        password：类型为String，用于指定压缩时的密码
 * @param {Function} [successCallback] 成功回调函数
 * @param {Function} [errorCallback]   失败回调函数
 * @platform Android, iOS, WP8
 * @since 3.0.0
 */
Zip.prototype.zipFiles = function(srcEntries, dstFilePath, successCallback, errorCallback, options){
    argscheck.checkArgs('asFFO', 'xFace.Zip.zipFiles', arguments);
    if(dstFilePath == "" && errorCallback){
        errorCallback(ZipError.FILE_NOT_EXIST);
        return;
    }
    exec(successCallback, errorCallback, "Zip", "zipFiles", [srcEntries, dstFilePath, options]);
};

module.exports = new Zip();
