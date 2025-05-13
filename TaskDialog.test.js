import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import TaskDialog from '../views/TaskDialog.vue';
import { useToast } from 'primevue/usetoast';
import * as api from '../services/api';

// Мокаем useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

// Мокаем getMemberAvatar
vi.mock('../services/api', () => ({
  getMemberAvatar: vi.fn(() => Promise.resolve('mocked-avatar-url')),
}));

describe('TaskDialog.vue', () => {
  // Базовые пропсы для тестов
  const defaultProps = {
    show: true,
    participants: [
      { member_id: '1', username: 'user1', name: 'User One' },
      { member_id: '2', username: 'user2', name: 'User Two' },
    ],
    task: null,
    mode: 'create',
  };

  // Хелпер для монтирования компонента
  const mountComponent = (props = {}) => {
    return mount(TaskDialog, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Dialog: {
            template: '<div class="p-dialog"><slot></slot></div>',
            props: ['visible', 'style', 'modal', 'draggable', 'showHeader', 'position'],
          },
          Button: {
            template: '<button class="p-button"><slot></slot></button>',
            props: ['icon', 'label', 'class'],
          },
          InputText: {
            template: '<input class="p-inputtext" v-bind="$attrs" />',
            props: ['modelValue'],
          },
          Textarea: {
            template: '<textarea class="p-textarea" v-bind="$attrs"></textarea>',
            props: ['modelValue', 'autoResize', 'rows'],
          },
          Calendar: {
            template: '<input class="p-calendar" v-bind="$attrs" />',
            props: ['modelValue', 'showIcon', 'dateFormat'],
          },
          Avatar: {
            template: '<div class="p-avatar"></div>',
            props: ['label', 'image', 'size', 'shape'],
          },
        },
      },
    });
  };

  it('рендерит форму для создания новой задачи', async () => {
    const wrapper = mountComponent();
    await nextTick();
    expect(wrapper.find('.task-title').text()).toBe('New task');
    expect(wrapper.find('input[placeholder="Task name"]').exists()).toBe(true);
    expect(wrapper.find('textarea[placeholder="Task description"]').exists()).toBe(true);
    expect(wrapper.find('button').text()).toContain('Create a task');
  });

  it('рендерит форму для редактирования задачи', async () => {
    const task = {
      name: 'Test Task',
      description: 'Test Description',
      priority: 'MEDIUM',
      start_at: '2023-10-01T00:00:00Z',
      end_at: '2023-10-02T00:00:00Z',
      implementer_member_ids: [1],
    };
    const wrapper = mountComponent({ mode: 'edit', task });
    await nextTick();
    expect(wrapper.find('.task-title').text()).toBe('Edit task');
    expect(wrapper.find('input[placeholder="Task name"]').element.value).toBe('Test Task');
    expect(wrapper.find('textarea[placeholder="Task description"]').element.value).toBe('Test Description');
    expect(wrapper.find('button').text()).toContain('Update Task');
  });

  it('устанавливает приоритет при клике на кнопку приоритета', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const priorityButtons = wrapper.findAll('.priority-button');
    expect(priorityButtons).toHaveLength(3); // Low, Medium, High
    await priorityButtons[1].trigger('click'); // Клик на Medium
    expect(wrapper.vm.taskPriority).toBe('Medium');
    expect(priorityButtons[1].classes()).toContain('active');
  });

  it('закрывает форму при клике на кнопку закрытия', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const closeButton = wrapper.find('.task-close-button');
    await closeButton.trigger('click');
    expect(wrapper.emitted('update:show')).toBeTruthy();
    expect(wrapper.emitted('update:show')[0]).toEqual([false]);
    expect(wrapper.vm.visible).toBe(false);
  });

  it('переключает панель выбора участников', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const selectButton = wrapper.find('.select-participant-button');
    expect(wrapper.vm.showParticipantPanel).toBe(false);
    await selectButton.trigger('click');
    expect(wrapper.vm.showParticipantPanel).toBe(true);
    await selectButton.trigger('click');
    expect(wrapper.vm.showParticipantPanel).toBe(false);
  });
});