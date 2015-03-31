# Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os, json, pandas, numpy
import urllib.request, urllib.parse, urllib.error, urllib.request, urllib.error, urllib.parse, IPython, datetime, calendar
from IPython.utils.traitlets import Unicode

class OutputContainer:
    def __init__(self):
        self.items = []
    def clear(self):
        self.items = [ ]
    def addItem(self, obj):
        self.items.append(obj)
    def getItems(self):
        return self.items

class BeakerCodeCell:
    def __init__(self, cellId, evaluatorId):
        self.cellId = cellId
        self.evaluatorId = evaluatorId
        self.code = ''
        self.outputtype = ''
        self.output = None
        self.tags = ''
    def getCellId(self):
        return self.cellId
    def getEvaluatorId(self):
        return self.evaluatorId
    def getCode(self):
        return self.code
    def getOutputType(self):
        return self.outputtype
    def getOutput(self):
        return self.output
    def getTags(self):
        return self.tags

def convertTypeName(typ):
    if typ.startswith("float"):
        return "double"
    if typ.startswith("int") or typ.startswith("uint") or typ.startswith("short") or typ.startswith("ushort") or typ.startswith("long") or typ.startswith("ulong"):
        return "integer"
    if typ.startswith("bool"):
        return "boolean"
    if typ.startswith("date"):
        return "time"
    return "string"

def isPrimitiveType(typ):
    if typ.startswith("float"):
        return True
    if typ.startswith("int") or typ.startswith("uint") or typ.startswith("short") or typ.startswith("ushort") or typ.startswith("long") or typ.startswith("ulong"):
        return True
    if typ.startswith("bool"):
        return True
    if typ.startswith("date"):
        return True
    if typ.startswith("str"):
        return True
    return False

def isListOfMaps(data):
    if type(data) != list:
        return False
    for w in data:
        if type(w) != dict:
            return False
        for v in w.values():
            if not isPrimitiveType(type(v).__name__):
                return False
    return True

def isDictionary(data):
    if type(data) != dict:
        return False
    for v in data.values():
        if not isPrimitiveType(type(v).__name__):
            return False
    return True

def transform(obj):
    if type(obj) == bytes:
        return str(obj)
    if isListOfMaps(obj):
        out = {}
        out['type'] = "TableDisplay"
        out['subtype'] = "ListOfMaps"
        cols = []
        for l in obj:
            cols.extend(l.keys())
        cols = list(set(cols))
        out['columnNames'] = cols
        vals = []
        for l in obj:
            row = []
            for r in cols:
                if r in l:
                    row.append(transform(l[r]))
                else:
                    row.append('')
            vals.append(row)
        out['values'] = vals
        return out
    if isDictionary(obj):
        out = {}
        out['type'] = "TableDisplay"
        out['subtype'] = "Dictionary"
        out['columnNames'] = [ "Key", "Value" ]
        values = []
        for k,v in obj.items():
            values.append( [k, transform(v)] )
        out['values'] = values
        return out
    if type(obj) == dict:
        out = {}
        for k,v in obj.items():
            out[k] = transform(v)
        return out
    if type(obj) == list:
        out = []
        for v in obj:
            out.append(transform(v))
        return out
    if isinstance(obj, OutputContainer):
        out = {}
        out['type'] = "OutputContainer"
        items = []
        for v in obj.getItems():
            items.append(transform(v))
        out['items'] = items
        return out
    if isinstance(obj, BeakerCodeCell):
        out = {}
        out['type'] = "BeakerCodeCell"
        out['cellId'] = obj.getCellId()
        out['evaluatorId'] = obj.getEvaluatorId()
        out['code'] = obj.getCode()
        out['outputtype'] = obj.getOutputType()
        out['output'] = transform(obj.getOutput())
        out['tags'] = obj.getTags()
        return out
    return obj

def transformBack(obj):
    if type(obj) == dict:
        out = {}
        for k,v in obj.items():
            out[str(k)] = transformBack(v)
        if "type" in out:
            if out['type'] == "BeakerCodeCell":
                c = BeakerCodeCell(out['cellId'], out['evaluatorId'])
                if 'code' in out:
                    c.code = out['code']
                if 'outputtype' in out:
                    c.outputtype = out['outputtype']
                if 'output' in out:
                    c.output = transformBack(out['output'])
                if 'tags' in out:
                    c.tags = out['tags']
                return c
            if out['type'] == "OutputContainer":
                c = OutputContainer()
                if 'items' in out:
                    for i in out['items']:
                        c.addItem(i)
                return c;
            if out['type'] == "Date":
                return datetime.datetime.fromtimestamp(out["timestamp"])
            if out['type'] == "TableDisplay":
                if 'subtype' in out:
                    if out['subtype'] == "Dictionary":
                        out2 = { }
                        for r in out['values']:
                            out2[r[0]] = r[1]
                        if out['columnNames'][0] == "Index":
                            return pandas.Series(out2)
                        return out2
                    if out['subtype'] == "Matrix":
                        return numpy.matrix(out['values'])
                    if out['subtype'] == "ListOfMaps":
                        out2 = []
                        cnames = out['columnNames']
                        for r in out['values']:
                            out3 = { }
                            for i in range(len(cnames)):
                                if r[i] != '':
                                    out3[ cnames[i] ] = r[i]
                            out2.append(out3)
                        return out2
                # transform to dataframe
                return pandas.DataFrame(data=out['values'], columns=out['columnNames'])
        return out
    if type(obj) == list:
        out = []
        for v in obj:
            out.append(transformBack(v))
        return out
    if type(obj) == bytes:
        obj = str(obj)
    return obj

# should be inner class to Beaker
class DataFrameEncoder(json.JSONEncoder):
    def default(self, obj):
        # similarly handle Panels.
        # make this extensible by the user to handle their own types.
        if isinstance(obj, numpy.generic):
            return obj.item()
        if isinstance(obj, numpy.ndarray) and obj.ndim == 2:
            out = {}
            out['type'] = "TableDisplay"
            out['subtype'] = "Matrix"
            cols = [ ]
            for i in range(obj.shape[1]):
                cols.append( "c" + str(i) )
            out['columnNames'] =cols
            out['values'] = obj.tolist()
            return out
        if isinstance(obj, numpy.ndarray):
            return obj.tolist()
        if type(obj) == datetime.datetime:
            out = {}
            out['type'] = "Date"
            out['timestamp'] = calendar.timegm(obj.timetuple())
            return out
        if type(obj) == pandas.core.frame.DataFrame:
            out = {}
            out['type'] = "TableDisplay"
            out['subtype'] = "TableDisplay"
            out['columnNames'] = obj.columns.tolist()
            out['values'] = obj.values.tolist()
            ty = []
            num = len(obj.columns.tolist())
            x = 0;
            for x in range(0,num):
                  ty.append( convertTypeName(type(obj.values[0][x]).__name__))
            out['types'] = ty
            return out
        if type(obj) == pandas.core.series.Series:
            basict = True
            for i in range(len(obj)):
                if not isPrimitiveType(type(obj[i]).__name__):
                    basict = False
                    break
            if basict:
                out = {}
                out['type'] = "TableDisplay"
                out['subtype'] = "Dictionary"
                out['columnNames'] = [ "Index", "Value" ]
                values = []
                for k,v in obj.items():
                    values.append( [k, transform(v)] )
                out['values'] = values
                return out
            return obj.to_dict()
        return json.JSONEncoder.default(self, obj)

class MyJSONFormatter(IPython.core.formatters.BaseFormatter):
    format_type = Unicode('application/json')
    def __call__(self, obj):
        try:
            obj = transform(obj)
            return json.dumps(obj, cls=DataFrameEncoder)
        except:
            return None

class Beaker:
    """Runtime support for Python code in Beaker."""
    session_id = ''
    registered = False
    core_url = '127.0.0.1:' + os.environ['beaker_core_port']
    password_mgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
    password_mgr.add_password(None, core_url, 'beaker',
                              os.environ['beaker_core_password'])
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.HTTPBasicAuthHandler(password_mgr)))
	
    def set4(self, var, val, unset, sync):
        args = {'name': var, 'session':self.session_id, 'sync':sync}
        if not unset:
            val = transform(val)
            args['value'] = json.dumps(val, cls=DataFrameEncoder)
        req = urllib.request.Request('http://' + self.core_url + '/rest/namespace/set',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        reply = conn.read().decode("utf-8")
        if reply != 'ok':
            raise NameError(reply)
	
    def get(self, var):
        req = urllib.request.Request('http://' + self.core_url + '/rest/namespace/get?' + 
                                     urllib.parse.urlencode({
                    'name': var,
                    'session':self.session_id}))
        conn = urllib.request.urlopen(req)
        result = json.loads(conn.read().decode())
        if not result['defined']:
            raise NameError('name \'' + var + '\' is not defined in notebook namespace')
        return transformBack(result['value'])
	
    def set_session(self, id):
        self.session_id = id
	
    def register_output(self):
        if (self.registered == False):
            ip = IPython.InteractiveShell.instance()
            ip.display_formatter.formatters['application/json'] = MyJSONFormatter(parent=ip.display_formatter)
            self.registered = True
	
    def set(self, var, val):
        return self.set4(var, val, False, True)
	
    def createOutputContainer(self):
        return OutputContainer()
	
    def showProgressUpdate(self):
        return "WARNING: python3 language plugin does not support progress updates"
	
    def evaluate(self,filter):
        args = {'filter': filter, 'session':self.session_id}
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/evaluate',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        result = json.loads(conn.read().decode())
        return transformBack(result)
	
    def evaluateCode(self, evaluator,code):
        args = {'evaluator': evaluator, 'code' : code, 'session':self.session_id}
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/evaluateCode',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        result = json.loads(conn.read().decode())
        return transformBack(result)
	
    def showStatus(self,msg):
        args = {'msg': msg, 'session':self.session_id}
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/showStatus',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        result = conn.read()
        return result=="true"
	
    def clearStatus(self,msg):
        args = {'msg': msg, 'session':self.session_id}
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/clearStatus',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        result = conn.read()
        return result=="true"
	
    def showTransientStatus(self,msg):
        args = {'msg': msg, 'session':self.session_id}
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/showTransientStatus',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        result = conn.read()
        return result=="true"
	
    def getEvaluators(self):
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/getEvaluators?' + 
                                     urllib.parse.urlencode({
                    'session':self.session_id}))
        conn = urllib.request.urlopen(req)
        result = json.loads(conn.read().decode())
        return transformBack(result)
	
    def getCodeCells(self,filter):
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/getCodeCells?' + 
                                     urllib.parse.urlencode({
                    'session':self.session_id, 'filter':filter}))
        conn = urllib.request.urlopen(req)
        result = json.loads(conn.read().decode())
        return transformBack(result)
	
    def setCodeCellBody(self,name,body):
        args = {'name': name, 'body':body, 'session':self.session_id}
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/setCodeCellBody',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        result = conn.read()
        return result=="true"
	
    def setCodeCellEvaluator(self,name,evaluator):
        args = {'name': name, 'evaluator':evaluator, 'session':self.session_id}
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/setCodeCellEvaluator',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        result = conn.read()
        return result=="true"
	
    def setCodeCellTags(self,name,tags):
        args = {'name': name, 'tags':tags, 'session':self.session_id}
        req = urllib.request.Request('http://' + self.core_url + '/rest/notebookctrl/setCodeCellTags',
                                     urllib.parse.urlencode(args).encode('utf8'))
        conn = urllib.request.urlopen(req)
        result = conn.read()
        return result=="true"
	
    def __setattr__(self, name, value):
        if 'session_id' == name:
            self.__dict__['session_id'] = value
            return
        return self.set(name, value)
	
    def __getattr__(self, name):
        return self.get(name)
