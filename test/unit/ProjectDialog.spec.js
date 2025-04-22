// tests/components/ProjectDialog.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import ProjectDialog from '@/views/ProjectDialog.vue'
import PrimeVue from 'primevue/config'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

// Общая конфигурация с PrimeVue и его компонентами
const globalConfig = {
  global: {
    plugins: [PrimeVue],
    components: {
      Dialog,
      Button,
      Avatar,
    }
  }
}

describe('ProjectDialog.vue', () => {
  it('renders correctly when visible', async () => {
    const wrapper = mount(ProjectDialog, {
      props: {
        show: true,
        project: { name: 'Project Alpha' }
      },
      ...globalConfig
    })

    expect(wrapper.find('.project-dialog').exists()).toBe(true)
    expect(wrapper.find('.project-title').text()).toBe('Project Alpha')
  })

  it('emits update:show when closed', async () => {
    const wrapper = mount(ProjectDialog, {
      props: {
        show: true,
        project: { name: 'Project Alpha' }
      },
      ...globalConfig
    })

    const closeBtn = wrapper.find('.close-button')
    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')

    expect(wrapper.emitted('update:show')).toBeTruthy()
    expect(wrapper.emitted('update:show')?.[0]).toEqual([false])
  })

  it('calls editProject when edit button is clicked', async () => {
    const logSpy = vi.spyOn(console, 'log')

    const wrapper = mount(ProjectDialog, {
      props: {
        show: true,
        project: { name: 'Project Alpha' }
      },
      ...globalConfig
    })

    const editBtn = wrapper.find('.edit-button')
    expect(editBtn.exists()).toBe(true)

    await editBtn.trigger('click')

    expect(logSpy).toHaveBeenCalledWith('Edit project clicked')

    logSpy.mockRestore()
  })
})
