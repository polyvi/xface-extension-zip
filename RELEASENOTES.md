<!--
#
# Copyright 2012-2013, Polyvi Inc. (http://polyvi.github.io/openxface)
# This program is distributed under the terms of the GNU General Public License.
# 
# This file is part of xFace.
# 
# xFace is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# xFace is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with xFace.  If not, see <http://www.gnu.org/licenses/>.
#
-->

# Release Notes
### 1.0.0 Tue Jan 07 2014 16:07:59 GMT+0800 (CST)
 *  uodate plugin version&license
 *  add zip support absolutePath,add test/zip/index.html
 *  [android]Modify source codes package path
### 1.0.1 Mon Jan 27 2014 15:55:59 GMT+0800 (CST)
 *  batch modify .reviewboard
 *  #2: 修改测试页面title错误
 *  #1: 修改两个测试案例结果描述
 *  Incremented plugin version on dev branch to 1.0.1-dev

## 1.0.2 (Fri Feb 28 2014)


 *  Add auto tests for resolving file path.
 *  Fix the incorrect api description.
 *  Update auto tests to make sure the original test cases can pass.
 *  [android]Zip plugin is compatible with url 'cdvfile://localhost/<filesystemType>/<path to file>'
 *  [iOS]Invoke file plugin resolveFilePath: method to process file path
 *  [iOS] Improve the processing logic of file path and support more path forms.
 *  Incremented plugin version on dev branch to 1.0.2-dev


## 1.0.3 (Wed Mar 19 2014)


 *  Remove FILE_PATH_ERROR error code and modify tests
 *  [iOS] Get rid of FILE_PATH_ERROR, and use FILE_NOT_EXIST error code instead.
 *  issue 4 Fix Zip: click 'zip fileUrl to workspace' button return error code 1, and add tests.Bug reason:due to refactor zip plugin. Solution: updates tests
 *  issue 1 automatic->ZIP: 6 failing. Bug reason:1.zip extension has changed some error code codition;2.Filesystem has be changed.Solution:1.modify some error code;2.Modify js interface calls
 *  [Android]Fix assets file whose path is end with '/' can't be compressed successfully
 *  [Android]Refactor xface-extension-zip native codes and it can support protocol 'file:///android_asset/'
 *  Incremented plugin version on dev branch to 1.0.3-dev
