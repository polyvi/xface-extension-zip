/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

describe("zip/unzip (xFace)", function () {

    // deletes specified file or directory
    var deleteEntry = function(rootEntry, name, success, error) {
        // deletes entry, if it exists
        window.resolveLocalFileSystemURI(rootEntry.toURL() + '/' + name,
            function(entry) {
                if (entry.isDirectory === true) {
                    entry.removeRecursively(success, error);
                } else {
                    entry.remove(success, error);
                }
            }, success);
    };

    it("Zip.spec.1 should exist xFace.Zip type", function() {
        expect(xFace.Zip).toBeDefined();
        expect(typeof xFace.Zip.zip).toBe("function");
        expect(typeof xFace.Zip.unzip).toBe("function");
        expect(typeof xFace.Zip.zipFiles).toBe("function");
    });

    it("Zip.spec.2 should define constants for ZipError errors", function() {
        expect(ZipError).toBeDefined();
        expect(ZipError.FILE_NOT_EXIST).toBe(1);
        expect(ZipError.COMPRESS_FILE_ERROR).toBe(2);
        expect(ZipError.UNZIP_FILE_ERROR).toBe(3);
        expect(ZipError.FILE_PATH_ERROR).toBe(4);
        expect(ZipError.FILE_TYPE_ERROR).toBe(5);
    });

    describe("xFace.Zip.zip Method", function(){
        it("Zip.spec.3 Source file exist destination file not exist! Success callback should be called ", function() {
            var srcFile         =  "SourceFile_1.html";
            var desFile         =  "test/destination_1.zip";
            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == "destination_1.zip").toBe(true);

                // cleanup
                deleteEntry(workspace_root, "test");
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack   =  jasmine.createSpy().andCallFake(function(errorcode){});
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                workspace_root.getFile(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            runs(function(){  xFace.Zip.zip(srcFile, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.4 Source file exist destination file also exist! Success callback should be called ", function() {

            var srcFile         =  "SourceFile_2.html";
            var desFile         =  "destination_2.zip";

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack   =  jasmine.createSpy().andCallFake(function(errorcode){});
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                workspace_root.getFile(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            runs(function(){ xFace.Zip.zip(srcFile, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000 );

            runs(function() {
               expect(ErrorCallBack).not.toHaveBeenCalled();
               expect(SuccessCallBack).toHaveBeenCalled();

               expect(FailFileReadCallBack).not.toHaveBeenCalled();
               expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.5 Source file are not exist! Error callback should be called with errorcode = 1(FILE_NOT_EXIST)", function() {
            var srcFile          =  "sourceFileIsNotExist.html";
            var desFile          =  "sourceFileIsNotExist.zip";
            var ErrorCallBack    =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_NOT_EXIST);
            });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(a){ });

            runs(function(){ xFace.Zip.zip(srcFile,desFile, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "error callback never called", 5000);

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.6 Source file are too big! success callback should be called ", function() {
            var srcFile          =  "big.data";
            var desFile          =  "big.zip";

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack    =  jasmine.createSpy().andCallFake(function(errorcode){});
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 workspace_root.getFile(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });



            runs(function(){ xFace.Zip.zip(srcFile,desFile, SuccessCallBack,ErrorCallBack); });


            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 90000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.7 Source file Path error! Error callback should be called with errorcode = 1(FILE_NOT_EXIST)", function() {
            var srcFile         =  "C:///\\\aaa///\\\aaa\\";
            var desFile         =  "srcPathWrong";
            var ErrorCallBack   =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_NOT_EXIST);
            });
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.zip(srcFile, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", 5000 );

            runs(function() {
               expect(SuccessCallBack).not.toHaveBeenCalled();
               expect(ErrorCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.8 Destination file Path error! Error callback should be called with errorcode = 1(FILE_NOT_EXIST)", function() {

            var srcFile         =  "SourceFile_1.html";//要测试本功能，必须保证srcFile存在，否则返回的是源文件不存在的错误
            var desFile         =  "C:///\\\aaa///\\\aaa\\";
            var ErrorCallBack   =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_NOT_EXIST);
            });
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.zip(srcFile, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", 5000 );

            runs(function() {
               expect(SuccessCallBack).not.toHaveBeenCalled();
               expect(ErrorCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.9 Source file and Destination file pathes are all error!Error callback should be called with errorcode = 1(FILE_NOT_EXIST)",function(){
            var srcFile         =  "C:///\\\bbb///\\\bbb\\";
            var desFile         =  "C:///\\\aaa///\\\aaa\\";
            var ErrorCallBack   =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_NOT_EXIST);
            });
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.zip(srcFile, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", Tests.TEST_TIMEOUT );

            runs(function() {
               expect(SuccessCallBack).not.toHaveBeenCalled();
               expect(ErrorCallBack).toHaveBeenCalled();
            });
        });

    });

    describe("xFace.Zip.unzip Method",function(){

        it("Zip.spec.10 Source file exists and destination path is valid! Success callback should be called ", function() {
            var srcFile          =  "UnzipSourcefile.zip";
            var desFile          =  "UnzipSourcefile";

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 workspace_root.getDirectory(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            runs(function(){ xFace.Zip.unzip(srcFile,desFile, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.11 Source file exists and destination path is 'unzip'! Success callback should be called ", function() {
            var srcFile          =  "theDestIsNull.zip";
            var desFile          =  "unzip/theDestIsNull.txt";

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == "theDestIsNull.txt").toBe(true);
                // cleanup
                deleteEntry(workspace_root, desFile);
            });

            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                workspace_root.getFile(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            runs(function(){ xFace.Zip.unzip(srcFile, 'unzip', SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.12 Source file does not exist! Error callback should be called with errorcode = 1(FILE_PATH_ERROR)", function() {
            var srcFile           =  "sourceFileIsNotExist.zip";
            var desFile           =  "";
            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){
                 expect(errorcode).toBe(ZipError.FILE_PATH_ERROR);
            });
            var SuccessCallBack   =  jasmine.createSpy().andCallFake(function(errorcode){ });

            runs(function(){ xFace.Zip.unzip(srcFile, desFile, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", 5000);

            runs(function() {
                 expect(SuccessCallBack).not.toHaveBeenCalled();
                 expect(ErrorCallBack).toHaveBeenCalled();
            });

        });


        it("Zip.spec.13 Source file type error! Error callback should be called with errorcode = 5(FILE_TYPE_ERROR)", function() {
            var srcFile           =  "tesk.apk";
            var desFile           =  "";
            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_TYPE_ERROR);
            });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(errorcode){ });

            runs(function(){ xFace.Zip.unzip(srcFile,desFile, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", 5000);

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });

        });

        it("Zip.spec.14 Source File path error ! error callback should be called with errorcode = 4(FILE_PATH_ERROR)", function() {
            var srcFile           =  "C:///\\\aaa///\\\aaa\\test.zip";
            var desFile           =  "";
            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe( ZipError.FILE_PATH_ERROR);
            });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){});

            runs(function(){ xFace.Zip.unzip(srcFile,desFile, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", 5000 );

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });

        });

        it("Zip.spec.15 Destination File path error! Error callback should be called with errorcode = 1(FILE_NOT_EXIST)", function() {
            var srcFile           =  "destination_2.zip";
            var desFile           =  "C:///\\\aaa///\\\aaa\\";
            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe( ZipError.FILE_NOT_EXIST);
            });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.unzip(srcFile,desFile, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", 5000 );

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });

        });

        it("Zip.spec.16 Source File and Destination File pathes all error! Error callback should be called with errorcode = 1(FILE_NOT_EXIST)", function() {
            var srcFile           =  "C:///\\\aaa///\\\aaa\\test.zip";
            var desFile           =  "C:///\\\bbb///\\\bbb\\";
            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe( ZipError.FILE_NOT_EXIST);
            });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.unzip(srcFile,desFile, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", Tests.TEST_TIMEOUT );

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });

        });
    });

    describe("xFace.Zip.zipFiles Method", function(){

        it("Zip.spec.17 compress two existed files! Success callback should be called ", function() {
            var entries         =  ["SourceFile_1.html", "SourceFile_2.html"];
            var desFile         =  "destination.zip";

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 workspace_root.getFile(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });
            runs(function(){  xFace.Zip.zipFiles(entries, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.18 compress two existed dir! Success callback should be called ", function() {
            var entries         =  ["pre_set", "appPackage"];
            var desFile         =  "destination2.zip";

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 workspace_root.getFile(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });
            runs(function(){  xFace.Zip.zipFiles(entries, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.19 compress a existed file and  a existed dir! Success callback should be called ", function() {
            var entries         =  ["SourceFile_1.html", "pre_set"];
            var desFile         =  "destination1.zip";

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                workspace_root.getFile(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });
            runs(function(){  xFace.Zip.zipFiles(entries, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.20 One of source files is not exist! Error callback should be called with errorcode = 1(FILE_NOT_EXIST)", function() {
            var entries         =  ["SourceFile_1.html", "sourceFileIsNotExist.html"];
            var desFile          =  "sourceFileIsNotExist.zip";
            var ErrorCallBack    =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_NOT_EXIST);
            });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.zipFiles(entries, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.21 two source files are not exist! Error callback should be called with errorcode = 1(FILE_NOT_EXIST)", function() {
            var entries         =  ["sourceFileIsNotExist1.html", "sourceFileIsNotExist2.html"];
            var desFile          =  "sourceFileIsNotExist.zip";
            var ErrorCallBack    =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_NOT_EXIST);
            });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.zipFiles(entries, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.22 Path of one source file is invalid! Error callback should be called with errorcode = 4(FILE_PATH_ERROR)", function() {
            var entries         =  ["SourceFile_1.html", "../test"];
            var desFile         =  "srcPathWrong";
            var ErrorCallBack   =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_PATH_ERROR);
            });
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.zipFiles(entries, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", Tests.TEST_TIMEOUT );

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.23 Path of destination file is invalid! Error callback should be called with errorcode = 4(FILE_PATH_ERROR)", function() {
            var srcFile         =  ["SourceFile_1.html", "SourceFile_2.html"];
            var desFile         =  "../test";
            var ErrorCallBack   =  jasmine.createSpy().andCallFake(function(errorcode){
                expect(errorcode).toBe(ZipError.FILE_PATH_ERROR);
            });
            var  SuccessCallBack =  jasmine.createSpy().andCallFake(function(){ });

            runs(function(){ xFace.Zip.zipFiles(srcFile, desFile, SuccessCallBack, ErrorCallBack); });

            waitsFor(function() { return ErrorCallBack.wasCalled; }, "ErrorCallBack  never called", Tests.TEST_TIMEOUT );

            runs(function() {
                expect(SuccessCallBack).not.toHaveBeenCalled();
                expect(ErrorCallBack).toHaveBeenCalled();
            });
        });
    });

    describe('File Path', function () {
        it("Zip.spec.24 success callback should be called with relative file path", function () {
            var srcFile          =  "UnzipSourcefile.zip";
            var desFile          =  "UnzipSourcefile";

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 workspace_root.getDirectory(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            runs(function(){ xFace.Zip.unzip(srcFile,desFile, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.25 success callback should be called with absolute appworkspace file path", function () {
            var srcFile          =  "UnzipSourcefile.zip";
            var desFile          =  "UnzipSourcefile";
            var cdvfileURL       =  workspace_root.toURL() + "/" + desFile;

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 workspace_root.getDirectory(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            var unsupportedOperation = jasmine.createSpy("Operation not supported");

            runs(function() {
                cordova.exec(function(localPath) {
                    xFace.Zip.unzip(srcFile, localPath, SuccessCallBack,ErrorCallBack);
                }, unsupportedOperation, 'File', '_getLocalFilesystemPath', [cdvfileURL]);
            });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.26 success callback should be called with absolute persisent file path", function () {
            var srcFile          =  "UnzipSourcefile.zip";
            var desFile          =  "UnzipSourcefile";
            var cdvfileURL       =  persistent_root.toURL() + "/" + desFile;

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(persistent_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 persistent_root.getDirectory(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            var unsupportedOperation = jasmine.createSpy("Operation not supported");

            runs(function() {
                cordova.exec(function(localPath) {
                    xFace.Zip.unzip(srcFile, localPath, SuccessCallBack,ErrorCallBack);
                }, unsupportedOperation, 'File', '_getLocalFilesystemPath', [cdvfileURL]);
            });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.27 success callback should be called with appworkspace file url", function () {
            var srcFile          =  "UnzipSourcefile.zip";
            var desFile          =  "UnzipSourcefile";
            var cdvfileURL       =  workspace_root.toURL() + "/" + desFile;

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 workspace_root.getDirectory(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            var unsupportedOperation = jasmine.createSpy("Operation not supported");

            runs(function() {
                cordova.exec(function(localPath) {
                    xFace.Zip.unzip(srcFile, "file://" + localPath, SuccessCallBack,ErrorCallBack);
                }, unsupportedOperation, 'File', '_getLocalFilesystemPath', [cdvfileURL]);
            });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.28 success callback should be called with persisent file url", function () {
            var srcFile          =  "UnzipSourcefile.zip";
            var desFile          =  "UnzipSourcefile";
            var cdvfileURL       =  persistent_root.toURL() + "/" + desFile;

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(persistent_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 persistent_root.getDirectory(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            var unsupportedOperation = jasmine.createSpy("Operation not supported");

            runs(function() {
                cordova.exec(function(localPath) {
                    xFace.Zip.unzip(srcFile, "file://" + localPath, SuccessCallBack,ErrorCallBack);
                }, unsupportedOperation, 'File', '_getLocalFilesystemPath', [cdvfileURL]);
            });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.29 success callback should be called with appworkspace cdvfile url", function () {
            var srcFile          =  "UnzipSourcefile.zip";
            var desFile          =  "UnzipSourcefile";
            var cdvfileURL       =  workspace_root.toURL() + "/" + desFile;

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(workspace_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 workspace_root.getDirectory(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            runs(function(){ xFace.Zip.unzip(srcFile,cdvfileURL, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });

        it("Zip.spec.30 success callback should be called with persisent cdvfile url", function () {
            var srcFile          =  "UnzipSourcefile.zip";
            var desFile          =  "UnzipSourcefile";
            var cdvfileURL       =  persistent_root.toURL() + "/" + desFile;

            var SuccessFileReadCallBack =  jasmine.createSpy().andCallFake(function (entry){
                expect(entry.name == desFile).toBe(true);

                // cleanup
                deleteEntry(persistent_root, desFile);
            });
            var FailFileReadCallBack = jasmine.createSpy().andCallFake(function(errorcode){});

            var ErrorCallBack     =  jasmine.createSpy().andCallFake(function(errorcode){ });
            var SuccessCallBack =  jasmine.createSpy().andCallFake(function(){
                 persistent_root.getDirectory(desFile,{create: false, exclusive: false}, SuccessFileReadCallBack,FailFileReadCallBack);
            });

            runs(function(){ xFace.Zip.unzip(srcFile,cdvfileURL, SuccessCallBack,ErrorCallBack); });

            waitsFor(function() { return SuccessCallBack.wasCalled&&SuccessFileReadCallBack.wasCalled; }, "SuccessCallBack  never called", 5000);

            runs(function() {
                expect(ErrorCallBack).not.toHaveBeenCalled();
                expect(SuccessCallBack).toHaveBeenCalled();

                expect(FailFileReadCallBack).not.toHaveBeenCalled();
                expect(SuccessFileReadCallBack).toHaveBeenCalled();
            });
        });
    });
});



