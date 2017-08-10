<!--
    Copyright 2017 TWO SIGMA OPEN SOURCE, LLC

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

           http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
-->

# BeakerX: Beaker extensions for Jupyter

[![Build Status](http://ec2-54-175-192-115.compute-1.amazonaws.com:8080/buildStatus/icon?job=BeakerX%20master)](http://ec2-54-175-192-115.compute-1.amazonaws.com:8080/job/BeakerX%20master)
[![Gitter chat](https://badges.gitter.im/twosigma/beakerx.png)](https://gitter.im/twosigma/beakerx)
[![Release](https://jitpack.io/v/twosigma/beakerx.svg)](https://jitpack.io/#twosigma/beakerx)
[![NPM version](https://badge.fury.io/js/beakerx.svg)](http://badge.fury.io/js/beakerx)
[![PyPI Version](https://badge.fury.io/py/beakerx.svg)](http://badge.fury.io/py/beakerx)

BeakerX is a collection of JVM kernels with widgets, plotting, tables,
autotranslation, and other extensions to the Jupyter Notebook and
Jupyter Lab.  BeakerX is in alpha, with major features still under
development, including incompatible changes without notice.

The [documentation](https://github.com/twosigma/beakerx/blob/master/doc/StartHere.ipynb) consists of tutorial notebooks on GitHub.

BeakerX is the successor to the [Beaker
Notebook (source code archive)](https://github.com/twosigma/beaker-notebook-archive).

## Install

Using [conda](https://conda.io/docs/install/quick.html) (except on Windows, see [Issue #5720](https://github.com/twosigma/beakerx/issues/5720)).

```
conda install -c beakerx beakerx
```

## Install

Using conda:

```
conda install -c conda-forge beakerx
```

Using pip:

```
pip install beakerx
jupyter nbextension install beakerx --py --sys-prefix
jupyter nbextension enable beakerx --py --sys-prefix
```
And then follow the guide on [Issue #5720](https://github.com/twosigma/beakerx/issues/5720).

## Usage

Start the Jupyter Notebook server: `jupyter notebook`

## Developer Install

Dependencies:

* [yarn](https://yarnpkg.com/lang/en/docs/install/)
* [conda](https://conda.io/docs/install/quick.html) (any Python 3 environment should be fine, but our documentation assumes conda).

```
conda create -y -n beakerx python=3.5 jupyter openjdk yarn
source activate beakerx
(cd beakerx; python setup.py install --single-version-externally-managed --record record.txt && python setup.py kernels)
jupyter nbextension install beakerx --py --sys-prefix
jupyter nbextension enable beakerx --py --sys-prefix

```


### Update after Java change

The kernels are installed to run out of the repo, so just a build should update the java code.

```
(cd kernel; ./gradlew build)
```

Note this is currently broken and you need to do a complete rebuild
after a java change. See
[#5739](https://github.com/twosigma/beakerx/issues/5739).

### Update after JS change

```
(cd beakerx/js; yarn webpack)
```

## Beaker Notebooks Converter

```
python -m beakerx.bkr2ipynb *.bkr
```

## Groovy with Interactive Plotting and Tables:
<img width="900" alt="screen shot" src="https://user-images.githubusercontent.com/963093/28300136-585f9f7c-6b4b-11e7-8827-b5807d3fc9a8.png">

## Autotranslation from Python to JavaScript:
<img width="900" alt="screen shot" src="https://cloud.githubusercontent.com/assets/963093/21077947/261def64-bf2a-11e6-8518-4845caf75690.png">

## Running with Docker
In root project call

`(cd kernel; gradle clean)`

To build beakerx base image execute

`docker build -t beakerx-base -f docker/base/Dockerfile .`

To build beakerx image execute

`docker build -t beakerx -f docker/Dockerfile .`

Now if you would like to start BeakerX execute

`docker run -p 8888:8888 beakerx `

## Contributing

We welcome developers to extend and improve BeakerX in ways that can
benefit everyone. In order for us to accept your code or pull request,
we need for you to fill out and email back to us a scan of a signed copy of the
[Contributor License Agreement](http://beakernotebook.com/cla.zip).

BeakerX uses [Google Java
style](https://google.github.io/styleguide/javaguide.html), and all
Java code needs unit tests.  For JavaScript we use [Google JS
style](https://google.github.io/styleguide/jsguide.html) with
[require](http://requirejs.org/) instead of goog.

## Attribution

Beaker contains and depends on many projects including:

The kernel is originally derived from
[lappsgrid](https://github.com/lappsgrid-incubator/jupyter-groovy-kernel),
but has been rewritten in Java and refactored and expanded.

The Java support uses Adrian Witas' org.abstractmeta.toolbox.

<a href="http://www.antlr.org/license.html">ANTLR</a> Copyright (c) 2012 Terence Parr and Sam Harwell

<a href="https://github.com/mbostock/d3/blob/master/LICENSE">d3</a> Copyright (c) 2010-2015, Michael Bostock

<a href="https://github.com/ipython/ipython/blob/master/COPYING.rst">IPython</a> Copyright (c) 2008-2014, IPython Development Team
Copyright (c) 2001-2007, Fernando Perez
Copyright (c) 2001, Janko Hauser
Copyright (c) 2001, Nathaniel Gray

<a href="https://github.com/JuliaLang/julia/blob/master/LICENSE.md">Julia</a> Copyright (c) 2009-2015: Jeff Bezanson, Stefan Karpinski, Viral B. Shah, and other contributors

<a href="http://www.scala-lang.org/license.html">Scala</a> Copyright (c) 2002-2015 EPFL
      Copyright (c) 2011-2015 Typesafe, Inc.

<a href=" http://www.h2database.com/html/license.html"> H2 database
engine</a>
This software contains unmodified binary redistributions for H2
database engine (http://www.h2database.com/), which is dual licensed
and available under the MPL 2.0 (Mozilla Public License) or under the
EPL 1.0 (Eclipse Public License).  An original copy of the license
agreement can be found at: http://www.h2database.com/html/license.html
