/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements. See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership. The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the
 specific language governing permissions and limitations
 under the License.
 */

@class ZipArchive;
@interface XZip : NSObject

/**
    将指定路径的文件压缩为zip文件,可采用密码方式（如果目标路径为空则压缩到当前目录）
    @param filePath 指定的文件的路径
    @param dstFilePath 指定的文件压缩的目标路径
    @param password 压缩采用的密码（可以为空,即不要密码）
    @return 返回压缩结果 YES表示成功,NO表示发生错误
 */
+ (BOOL) compressFile:(NSString*)filePath To:(NSString*)dstFilePath withPassword:(NSString*)password;

/**
    将指定路径的多个文件或文件夹压缩为zip文件,可采用密码方式
    @param filePaths 指定的文件的路径
    @param dstZipFile 指定的文件压缩的目标路径
    @param password 压缩采用的密码（可以为空,即不要密码）
    @return 返回压缩结果 YES表示成功,NO表示发生错误
 */
+ (BOOL) compressFiles:(NSMutableArray*)filePaths To:(NSString*)dstZipFile withPassword:(NSString*)password;

/**
    将指定路径的文件夹压缩为zip文件,可采用密码方式（如果目标路径为空则压缩到当前目录）
    @param folderPath 指定的文件夹的路径
    @param dstFilePath 指定的文件压缩的目标路径
    @param password 压缩采用的密码（可以为空,即不要密码）
    @return 返回压缩结果 YES表示成功,NO表示发生错误
 */
+ (BOOL) compressFolder:(NSString*)folderPath To:(NSString*)dstFilePath withPassword:(NSString*)password;

/**
    将指定路径的zip文件解压到指定路径,可采用密码方式（如果目标路径为空则解压到当前目录）
    @param zipFilePath 指定的zip文件的路径
    @param dstFilePath 指定的zip文件解压的目标路径
    @param password 解压时的密码（可以为空,即不要密码）
    @return 返回压缩结果 YES表示成功,NO表示发生错误
 */
+ (BOOL) unZipFile:(NSString*)zipFilePath To:(NSString*)dstFilePath withPassword:(NSString*)password;

/**
    将指定路径（filePath）的文件夹下的文件,通过遍历将所有文件加入到zip文件
    @param zipFilePath      指定的压缩目标zip文件的路径
    @param filePath         指定的被压缩的文件夹的路径
    @param rootFilePath     指定的被压缩的文件夹的根路径
    @param zip              ZipArchive 压缩处理对象
    @return 返回压缩结果 YES表示成功,NO表示发生错误
 */
+ (BOOL)addFileToZip:(NSString*)zipFilePath useZipArchive:(ZipArchive*)zip atPath: (NSString *)filePath rootPath:(NSString *)rootFilePath;

/**
    取出当前压缩文件相对于压缩文件起始这一级的相对的fileName
    @param rootFilePath      待压缩文件的起始路径
    @param currentFilePath   当前正在处理的文件
    @return 返回压缩文件相对于zipfile 所在这一级的相对的fileName
 */
+ (NSString*) getRelativeFileName:(NSString*)currentFilePath withRootFilePath:(NSString*)rootFilePath;

@end
