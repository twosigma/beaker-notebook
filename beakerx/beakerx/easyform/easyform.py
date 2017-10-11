# Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
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

from beakerx.utils import getValue
from beakerx.beakerx_widgets import *
from ipykernel.comm import Comm
from traitlets import Unicode, Bool, Int, Dict, ObjectName, Unicode, default, \
    Any, Union, List

from ipywidgets import SelectMultiple, Select, Dropdown, RadioButtons


class DatePicker(BeakerxDOMWidget):
    def __init__(self, value=None, **kwargs):
        if value is not None:
            kwargs['value'] = value
        super(DatePicker, self).__init__(**kwargs)
    
    _view_name = Unicode('DatePickerView').tag(sync=True)
    _model_name = Unicode('DatePickerModel').tag(sync=True)
    showTime = Bool(default_value=False,
                    help="Enable or disable user changes.").tag(sync=True)
    value = Unicode(default_value="").tag(sync=True)
    description = Unicode(default_value="").tag(sync=True)


class SelectMultipleWithRows(SelectMultiple):
    def __init__(self, **kwargs):
        super(SelectMultipleWithRows, self).__init__(**kwargs)
    
    _view_module = Unicode('beakerx').tag(sync=True)
    _model_module = Unicode('beakerx').tag(sync=True)
    size = Int(5, help="The number of rows to display.").tag(sync=True)


class SelectMultipleSingle(Select):
    def __init__(self, **kwargs):
        super(SelectMultipleSingle, self).__init__(**kwargs)
    
    _view_name = Unicode('SelectMultipleSingleView').tag(sync=True)
    _model_name = Unicode('SelectMultipleSingleModel').tag(sync=True)
    _view_module = Unicode('beakerx').tag(sync=True)
    _model_module = Unicode('beakerx').tag(sync=True)
    size = Int(5, help="The number of rows to display.").tag(sync=True)


class ComboBox(Dropdown):
    def __init__(self, **kwargs):
        super(ComboBox, self).__init__(**kwargs)
    
    _view_name = Unicode('ComboBoxView').tag(sync=True)
    _model_name = Unicode('ComboBoxModel').tag(sync=True)
    _view_module = Unicode('beakerx').tag(sync=True)
    _model_module = Unicode('beakerx').tag(sync=True)
    editable = Bool(default_value=False).tag(sync=True)
    original_options = Union([List(), Dict()])
    
    def _handle_msg(self, msg):
        if 'value' in msg['content']['data']['sync_data']:
            if msg['content']['data']['sync_data']['value'] not in self.options:
                self.options = self.original_options[:]
                self.options += (msg['content']['data']['sync_data']['value'],)
        super(ComboBox, self)._handle_msg(msg)


class EasyForm(BeakerxBox):
    _view_name = Unicode('EasyFormView').tag(sync=True)
    _model_name = Unicode('EasyFormModel').tag(sync=True)
    easyFormName = Unicode(default_value='Form default').tag(sync=True)
    test = ""
    HORIZONTAL = 1
    VERTICAL = 2
    
    def __init__(self, *args, **kwargs):
        super(EasyForm, self).__init__(**kwargs)
        self.easyFormName = getValue(kwargs, 'title', "")
        if self.easyFormName == "" and len(args) > 0:
            self.easyFormName = args[0]
    
    def _handle_msg(self, msg):
        print(msg)
    
    def addTextField(self, *args, **kwargs):
        text = BeakerxText(description=self.getDescription(args, kwargs))
        text.size = getValue(kwargs, 'width', -1)
        self.children += (text,)
        return text
    
    def addTextArea(self, *args, **kwargs):
        textarea = BeakerxTextArea(
                description=self.getDescription(args, kwargs))
        textarea.cols = getValue(kwargs, 'width', -1)
        textarea.rows = getValue(kwargs, 'height', -1)
        self.children += (textarea,)
        return textarea
    
    def addButton(self, *args, **kwargs):
        button = BeakerxButton(description=self.getDescription(args, kwargs))
        button.tag = getValue(kwargs, 'tag', "")
        button.on_click(self.buttonCallback)
        self.children += (button,)
        
        return button
    
    def buttonCallback(self, *args):
        if len(args) > 0:
            args[0].actionPerformed()
            arguments = dict(target_name='beaker.tag.run')
            comm = Comm(**arguments)
            msg = {'runByTag': args[0].tag}
            state = {'state': msg}
            comm.send(data=state, buffers=[])
    
    def addList(self, *args, **kwargs):
        multi_select = getValue(kwargs, 'multi', True)
        if multi_select:
            list = SelectMultipleWithRows(
                    description=self.getDescription(args, kwargs))
        else:
            list = SelectMultipleSingle(
                    description=self.getDescription(args, kwargs))
        list.options = self.getOptions(args, kwargs)
        list.size = getValue(kwargs, 'rows', 2)
        
        self.children += (list,)
        
        return list
    
    def addDatePicker(self, *args, **kwargs):
        data_picker = DatePicker(description=self.getDescription(args, kwargs))
        self.children += (data_picker,)
        
        return data_picker
    
    def addComboBox(self, *args, **kwargs):
        dropdown = ComboBox(description=self.getDescription(args, kwargs))
        dropdown.options = self.getOptions(args, kwargs)
        dropdown.original_options = self.getOptions(args, kwargs)
        dropdown.editable = getValue(kwargs, 'editable', False)
        self.children += (dropdown,)
        
        return dropdown
    
    def addCheckBox(self, *args, **kwargs):
        checkbox = BeakerxCheckbox(description=self.getDescription(args, kwargs))
        self.children += (checkbox,)
        return checkbox
    
    def addCheckBoxes(self, *args, **kwargs):
        layout = BeakerxHBox()
        orientation = getValue(kwargs, 'orientation', 2)
        if orientation == EasyForm.HORIZONTAL:
            box = BeakerxHBox()
        else:
            box = BeakerxVBox()
        
        for checkBoxItem in self.getOptions(args, kwargs):
            checkbox = BeakerxCheckbox(description=checkBoxItem)
            box.children += (checkbox,)
            
        layout.children += (BeakerxLabel(value=self.getDescription(args, kwargs)), box,)
        self.children += (layout,)
        
        return layout
    
    def addRadioButtons(self, *args, **kwargs):
        orientation = getValue(kwargs, 'orientation', EasyForm.VERTICAL)
        radio_buttons = RadioButtons(options=self.getOptions(args, kwargs),
                                     description=self.getDescription(args,
                                                                     kwargs))
        radio_buttons.index = None
        if orientation == EasyForm.VERTICAL:
            self.children += (radio_buttons,)
        else:
            box = BeakerxHBox()
            box.children += (radio_buttons,)
            self.children += (box,)
        
        return radio_buttons
    
    def keySet(self):
        return self.children
    
    def __getitem__(self, key):
        return self.get(key)
    
    def __setitem__(self, key, value):
        self.put(key, value)
    
    def get(self, key):
        for child in self.children:
            if child.description == key:
                return child.value
    
    def put(self, key, value):
        for child in self.children:
            if child.description == key:
                child.value = value
                break
    
    @staticmethod
    def getDescription(args, kwargs):
        if len(args) > 0:
            return args[0]
        else:
            return getValue(kwargs, 'description', "")
    
    @staticmethod
    def getOptions(args, kwargs):
        if len(args) > 1:
            return args[1][:]
        else:
            return getValue(kwargs, 'options', [])
