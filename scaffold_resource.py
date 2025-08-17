# ===============================================================================
# Copyright 2025 ross
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ===============================================================================
from pathlib import Path
import os

from mako.template import Template

list_template = """
import { useMemo, useState } from 'react'
import { useDataGrid } from '@refinedev/mui'
import {
  GridColDef,
} from '@mui/x-data-grid'
import { I${label} } from '@/interfaces/ocotillo/I${label}'

import { ListPage } from '@/components/ListPage'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'

export const ${label}List: React.FC = () => {
  const { dataGridProps } = useDataGrid<I${label}>({
    resource: '${resource}',
    dataProviderName: 'ocotillo',

    // it would be great to use staleTime and cacheTime here, but it seems
    // that when staleTime is set, the data is not refetched when the component is remounted
    // after editing a record.

    // queryOptions: {
    //   cacheTime: 60000, // Cache for 1 minute
    // staleTime: 30000, // Consider data fresh for 30 seconds
    // },
  })

  const columns = useMemo<GridColDef<I${label}>[]>(
    () => [
      idColumnDef(),
      {
        field: 'created_at',
        headerName: 'Created At',
        type: 'dateTime',
        minWidth: 180,
        valueGetter: (params) => new Date(params),
      },
      actionColumnDef(),
    ],
    []
  )

  return (
    <ListPage
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.id}
      description={'please add me'}
    />
  )
}
"""

interface_template = """
export interface I${label} {
  id: string
  created_at: string
}"""

show_template = """
import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { I${label} } from '@/interfaces/ocotillo/I${label}'
import Grid from '@mui/material/Grid2'

export const ${label}Show = () => {
  const { query } = useShow<I${label}>({
    resource: 'ocotillo.${resource}',
  })
  const { data, isLoading } = query
  const record = data?.data as I${label}



  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <DynamicShowDisplay record={record} fieldConfigs={fieldConfigs} />
        </Grid>
      </Grid>
    </Show>
  )
}

"""

edit_template = """
import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'

import { useForm } from '@refinedev/react-hook-form'
import { CreateEdit${label} } from '@/components/form/${form}/CreateEdit${label}'
import type { Nullable } from '@/interfaces'
import { I${label} } from '@/interfaces/ocotillo/I${label}'

export const ${label}Edit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<I${label}, HttpError, Nullable<I${label}>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEdit${label}
        register={register}
        control={control}
        errors={errors}
        setValue={setValue}
        mode="standalone"
      />
    </Edit>
  )
}

"""
create_template = """
import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm } from '@refinedev/react-hook-form'

import { Nullable } from '../../../interfaces'
import { I${label} } from '@/interfaces/ocotillo/I${label}'
import { CreateEdit${label} } from '@/components/form/${form}/CreateEdit${label}'

export const ${label}Create: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<I${label}, HttpError, Nullable<I${label}>>()


  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEdit${label}
        errors={errors}
        control={control}
        register={register}
        setValue={setValue}
        mode={'standalone'}
      />
    </Create>
  )
}
"""

create_edit_form_component_template = """
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { I${label} } from '@/interfaces/ocotillo/I${label}'
import { Controller } from 'react-hook-form'
import { Autocomplete, Typography } from '@mui/material'
import { useRef, useEffect, useState } from 'react'
import Grid from '@mui/material/Grid2'

export const CreateEdit${label} = ({
  control,
  register,
  errors,
  setValue,
  mode,
}) => {
  
  return (
    <Grid container spacing={2} alignItems="center">
    </Grid>
  )
}

"""


def make_interface(label):
    p = Path('src', 'interfaces', 'ocotillo', f'I{label}.ts')
    with open(p, 'w') as wfile:
        template = Template(interface_template)
        txt = template.render(label=label)
        wfile.write(txt)


def make_list_page(root, resource, label):
    _render(root, 'list', list_template, resource, label)


def make_show_page(root, resource, label):
    _render(root, 'show', show_template, resource, label)


def make_edit_page(root, resource, label):
    _render(root, 'edit', edit_template, resource, label, form='thing')


def make_create_page(root, resource, label):
    _render(root, 'create', create_template, resource, label, form='thing')


def make_create_edit_form_component(base, label, **kw):
    p = Path('src', 'components', 'form', base, f'CreateEdit{label}.tsx')
    with open(p, 'w') as wfile:
        template = Template(create_edit_form_component_template)
        txt = template.render(label=label, **kw)
        wfile.write(txt)


def _render(root, page, template, resource, label, **kw):
    p = root / f'{page}.tsx'
    with open(p, 'w') as wfile:
        template = Template(template)
        txt = template.render(label=label,
                              resource=resource, **kw)
        wfile.write(txt)


def make_index(root):
    p = root / 'index.tsx'
    with open(p, 'w') as wfile:
        txt = """export * from './list'
export * from './show'
export * from './edit'
export * from './create' 
"""
        wfile.write(txt)


def make_page(resource):
    path = Path('src', 'pages', 'ocotillo', resource)
    if not path.exists():
        os.mkdir(path)
    return path


def main():
    resource = 'well-screen'
    label = 'WellScreen'
    make_interface(label)

    page_root = make_page(resource)
    make_index(page_root)
    make_list_page(page_root, resource, label)
    make_show_page(page_root, resource, label)
    make_create_page(page_root, resource, label)
    make_edit_page(page_root, resource, label)
    make_create_edit_form_component('thing', label)


if __name__ == '__main__':
    main()
# ============= EOF =============================================
